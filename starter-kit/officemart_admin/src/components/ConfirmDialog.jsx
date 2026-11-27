export default function ConfirmDialog({ open, productName, loading, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="confirm-dialog"
        data-testid="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="confirm-title">
          Xác nhận xoá sản phẩm
        </h2>
        <p className="confirm-message">
          Bạn có chắc chắn muốn xoá sản phẩm <strong>{productName}</strong>? Thao tác này không thể hoàn tác.
        </p>
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="confirm-no"
            onClick={onCancel}
            disabled={loading}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-testid="confirm-yes"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}

