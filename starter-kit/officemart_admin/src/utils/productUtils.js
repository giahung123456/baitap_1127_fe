export function formatPrice(price) {
  return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`;
}

const SKU_REGEX = /^[A-Z]{3}-\d{4}$/;

export function validateProductForm(values) {
  const errors = {};

  const trimmedName = typeof values.name === 'string' ? values.name.trim() : '';
  if (!trimmedName) {
    errors.name = 'Vui lòng nhập tên sản phẩm';
  } else if (trimmedName.length < 3 || trimmedName.length > 100) {
    errors.name = 'Tên sản phẩm phải từ 3 đến 100 ký tự';
  }

  const sku = typeof values.sku === 'string' ? values.sku : '';
  if (!sku.trim()) {
    errors.sku = 'Vui lòng nhập mã SKU';
  } else if (!SKU_REGEX.test(sku)) {
    errors.sku = 'SKU phải đúng định dạng ABC-1234 (3 chữ in hoa, gạch ngang, 4 chữ số)';
  }

  if (!values.category) {
    errors.category = 'Vui lòng chọn danh mục';
  }

  const priceStr = String(values.price ?? '').trim();
  const priceNum = Number(priceStr);
  if (!priceStr || Number.isNaN(priceNum) || priceNum <= 0) {
    errors.price = 'Giá phải là số lớn hơn 0';
  }

  const stockStr = String(values.stock ?? '').trim();
  const stockNum = Number(stockStr);
  if (
    stockStr === '' ||
    Number.isNaN(stockNum) ||
    !Number.isInteger(stockNum) ||
    stockNum < 0
  ) {
    errors.stock = 'Tồn kho phải là số nguyên không âm';
  }

  return errors;
}

