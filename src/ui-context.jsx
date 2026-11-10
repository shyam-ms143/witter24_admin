import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "./api";

// Toasts (react-toastify, as in hah-admin) + promise-based confirm modals.
export const notify = {
  success: (msg) => msg && toast.success(msg),
  error: (msg) => msg && toast.error(msg, { autoClose: 5000 }),
};

const ConfirmContext = createContext(null);

// confirm({ title, body, confirm_label, variant, input: { label, placeholder, required } })
//   → Promise<false | true | string (input value)>
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [value, setValue] = useState("");
  const resolver = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setValue("");
        setDialog(typeof opts === "string" ? { body: opts } : opts);
      }),
    []
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const input = dialog?.input;
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal show={Boolean(dialog)} onHide={() => close(false)} centered>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (input?.required && !value.trim()) return;
            close(input ? value : true);
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title as="h5">{dialog?.title || "Confirm"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {dialog?.body && <p className={input ? "mb-3" : "mb-0"}>{dialog.body}</p>}
            {input && (
              <Form.Group controlId="confirm_input">
                <Form.Label>{input.label}</Form.Label>
                <Form.Control as="textarea" rows={4} autoFocus value={value} placeholder={input.placeholder} onChange={(e) => setValue(e.target.value)} />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" variant={dialog?.variant || "primary"} disabled={input?.required && !value.trim()}>
              {dialog?.confirm_label || "Confirm"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);

// Runs a member action (approve, deactivate, delete, ...): optional confirm modal, then a toast and
// either a redirect or a reload of the current page.
export function useRunner(reload) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  return useCallback(
    async (method, path, { confirm: question, variant, confirm_label, body, redirect } = {}) => {
      if (question) {
        const ok = await confirm({ body: question, variant: variant || (method === "del" ? "danger" : "primary"), confirm_label });
        if (!ok) return null;
      }
      try {
        const res = await api[method](path, body);
        notify.success(res?.message);
        if (redirect) navigate(redirect);
        else await reload?.();
        return res;
      } catch (e) {
        notify.error(e.message);
        return null;
      }
    },
    [confirm, navigate, reload]
  );
}
