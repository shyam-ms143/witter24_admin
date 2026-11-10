import { Button, ButtonGroup, Col, Form, Row } from "react-bootstrap";

const PER_PAGE_OPTIONS = [10, 30, 50, 100];

// hah-admin table footer: rows-per-page select · info · btn-sm btn-outline-primary page buttons
export default function Pagination({ meta, onPage, onPerPage }) {
  if (!meta) return null;
  const { page, per_page, total, total_pages } = meta;
  const from = total === 0 ? 0 : (page - 1) * per_page + 1;
  const to = Math.min(page * per_page, total);

  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(total_pages, page + 2); p += 1) pages.push(p);

  return (
    <Row className="table-footer align-items-center">
      <Col xs={12} md={4}>
        <div className="rows-per-page">
          <span>Rows per page</span>
          <Form.Select size="sm" value={per_page} onChange={(e) => onPerPage(Number(e.target.value))} aria-label="Rows per page">
            {[...new Set([...PER_PAGE_OPTIONS, per_page])]
              .sort((a, b) => a - b)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </Form.Select>
        </div>
      </Col>
      <Col xs={12} md={3} className="table-info">
        {total === 0 ? "No records" : `Showing ${from} to ${to} of ${total}`}
      </Col>
      <Col xs={12} md={5}>
        {total_pages > 1 && (
          <ButtonGroup className="float-md-end flex-wrap">
            <Button size="sm" variant="outline-primary" disabled={page === 1} onClick={() => onPage(1)}>
              First
            </Button>
            <Button size="sm" variant="outline-primary" disabled={page === 1} onClick={() => onPage(page - 1)}>
              Prev
            </Button>
            {pages.map((p) => (
              <Button key={p} size="sm" variant={p === page ? "primary" : "outline-primary"} onClick={() => onPage(p)}>
                {p}
              </Button>
            ))}
            <Button size="sm" variant="outline-primary" disabled={page === total_pages} onClick={() => onPage(page + 1)}>
              Next
            </Button>
            <Button size="sm" variant="outline-primary" disabled={page === total_pages} onClick={() => onPage(total_pages)}>
              Last
            </Button>
          </ButtonGroup>
        )}
      </Col>
    </Row>
  );
}
