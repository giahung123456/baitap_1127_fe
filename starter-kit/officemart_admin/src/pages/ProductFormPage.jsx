import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosClient.js';
import { useToast } from '../context/ToastContext.jsx';
import { validateProductForm } from '../utils/productUtils.js';

const INITIAL_FORM = {
  name: '',
  sku: '',
  category: '',
  price: '',
  stock: '',
  status: 'active',
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loadingPage, setLoadingPage] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await api.get('/categories');
        if (!cancelled) {
          setCategories(res.data || []);
        }
      } catch {
        // Nếu lỗi tải danh mục thì giữ mảng rỗng
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setForm(INITIAL_FORM);
      setErrors({});
      setSubmitError('');
      setNotFound(false);
      setLoadError('');
      setLoadingPage(false);
      return undefined;
    }

    let cancelled = false;

    async function fetchProduct() {
      setLoadingPage(true);
      setLoadError('');
      setNotFound(false);
      try {
        const res = await api.get(`/products/${id}`);
        if (cancelled) return;
        const p = res.data;
        setForm({
          name: p.name ?? '',
          sku: p.sku ?? '',
          category: p.category ?? '',
          price: p.price !== undefined && p.price !== null ? String(p.price) : '',
          stock: p.stock !== undefined && p.stock !== null ? String(p.stock) : '',
          status: p.status ?? 'active',
        });
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(
            err.response?.data?.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    }

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reloadKey]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (submitError) {
      setSubmitError('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    const validationErrors = validateProductForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status,
    };

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        showToast('Đã cập nhật sản phẩm');
      } else {
        await api.post('/products', payload);
        showToast('Đã thêm sản phẩm');
      }
      navigate('/products');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 409) {
        setErrors((prev) => ({
          ...prev,
          sku: data?.message || 'SKU đã tồn tại',
        }));
      } else if (status === 400 && data?.field) {
        setErrors((prev) => ({
          ...prev,
          [data.field]: data.message || 'Dữ liệu không hợp lệ',
        }));
      } else if (status === 404) {
        setNotFound(true);
      } else {
        setSubmitError(data?.message || 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/products')}
        >
          Quay lại
        </button>
      </div>

      {loadingPage && (
        <div className="state-box" data-testid="loading">
          Đang tải thông tin sản phẩm...
        </div>
      )}

      {!loadingPage && notFound && (
        <div className="state-box state-error" data-testid="error-message">
          <p>Không tìm thấy sản phẩm</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/products')}
          >
            Quay về danh sách
          </button>
        </div>
      )}

      {!loadingPage && !notFound && loadError && (
        <div className="state-box state-error" data-testid="error-message">
          <p>{loadError}</p>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="retry-button"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Thử lại
          </button>
        </div>
      )}

      {!loadingPage && !notFound && !loadError && (
        <div className="form-card">
          <form
            className="product-form"
            data-testid="product-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {submitError && (
              <div className="form-alert" data-testid="error-message">
                {submitError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Tên sản phẩm</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="VD: Bàn phím cơ K87"
              />
              {errors.name && (
                <p className="field-error" data-testid="field-error-name">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input
                id="sku"
                name="sku"
                type="text"
                value={form.sku}
                onChange={handleChange}
                placeholder="VD: KEY-0001"
              />
              {errors.sku && (
                <p className="field-error" data-testid="field-error-sku">
                  {errors.sku}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="category">Danh mục</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="field-error" data-testid="field-error-category">
                  {errors.category}
                </p>
              )}
            </div>

            <div className="form-row-two">
              <div className="form-group">
                <label htmlFor="price">Giá (₫)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="any"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="VD: 1290000"
                />
                {errors.price && (
                  <p className="field-error" data-testid="field-error-price">
                    {errors.price}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="stock">Tồn kho</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  step="any"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="VD: 10"
                />
                {errors.stock && (
                  <p className="field-error" data-testid="field-error-stock">
                    {errors.stock}
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
              {errors.status && (
                <p className="field-error" data-testid="field-error-status">
                  {errors.status}
                </p>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/products')}
                disabled={submitting}
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                data-testid="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

