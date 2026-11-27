import { categoryNames } from '../data/sample.js';
import { formatPrice } from '../utils/productUtils.js';

export default function ProductRow({ product, categoriesMap, onEdit, onDelete }) {
  const categoryLabel =
    (categoriesMap && categoriesMap[product.category]) ||
    categoryNames[product.category] ||
    product.category;

  const isActive = product.status === 'active';

  return (
    <tr data-testid="product-row">
      <td data-label="Tên" className="cell-name">
        {product.name}
      </td>
      <td data-label="SKU" className="cell-sku">
        {product.sku}
      </td>
      <td data-label="Danh mục">{categoryLabel}</td>
      <td data-label="Giá" className="cell-price">
        {formatPrice(product.price)}
      </td>
      <td data-label="Tồn kho">
        {product.stock === 0 ? (
          <span className="out-of-stock">Hết hàng</span>
        ) : (
          product.stock
        )}
      </td>
      <td data-label="Trạng thái">
        <span
          data-testid="product-status"
          className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}
        >
          {isActive ? 'Đang bán' : 'Ngừng bán'}
        </span>
      </td>
      <td data-label="Thao tác" className="cell-actions">
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-edit"
            data-testid="edit-button"
            onClick={() => onEdit && onEdit(product)}
          >
            Sửa
          </button>
          <button
            type="button"
            className="btn btn-delete"
            data-testid="delete-button"
            onClick={() => onDelete && onDelete(product)}
          >
            Xoá
          </button>
        </div>
      </td>
    </tr>
  );
}

