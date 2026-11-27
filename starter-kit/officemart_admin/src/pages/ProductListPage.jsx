import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosClient.js';
import ProductTable from '../components/ProductTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useProductSearch from '../hooks/useProductSearch.js';

const PAGE_SIZE = 10;
const VALID_STATUSES = ['active', 'inactive'];

function parsePage(raw) {
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) return 1;
  return num;
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = (searchParams.get('q') || '').trim();
  const urlCategory = searchParams.get('category') || '';
  const rawStatus = searchParams.get('status') || '';
  const urlStatus = VALID_STATUSES.includes(rawStatus) ? rawStatus : '';
  const urlPage = parsePage(searchParams.get('page'));

  const [searchInput, setSearchInput] = useState(urlQ);
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [reloadKey, setReloadKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    data: products,
    total,
    loading,
    error,
  } = useProductSearch({
    q: urlQ,
    category: urlCategory,
    status: urlStatus,
    page: urlPage,
    limit: PAGE_SIZE,
    reloadKey,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function updateSearchParams(overrides, options) {
    const nextQ = overrides.q !== undefined ? overrides.q.trim() : urlQ;
    const nextCategory = overrides.category !== undefined ? overrides.category : urlCategory;
    const nextStatus = overrides.status !== undefined ? overrides.status : urlStatus;
    const nextPage = overrides.page !== undefined ? overrides.page : urlPage;

    const params = {};
    if (nextQ) params.q = nextQ;
    if (nextCategory) params.category = nextCategory;
    if (nextStatus) params.status = nextStatus;
    if (nextPage > 1) params.page = String(nextPage);

    setSearchParams(params, options);
  }

  // Đồng bộ ô tìm kiếm khi URL thay đổi (VD: mở thẳng URL hoặc bấm Back/Forward)
  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  // Debounce 400ms cho ô tìm kiếm
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === urlQ) return undefined;

    const timer = setTimeout(() => {
      updateSearchParams({ q: trimmed, page: 1 });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, urlQ]);

  // Điều chỉnh nếu số trang trên URL vượt quá tổng số trang (VD: page=999)
  useEffect(() => {
    if (!loading && !error && total > 0 && urlPage > totalPages) {
      updateSearchParams({ page: totalPages }, { replace: true });
    }
  }, [loading, error, total, urlPage, totalPages]);

  // Tải danh sách danh mục từ API
  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await api.get('/categories');
        if (cancelled) return;
        const list = res.data || [];
        setCategories(list);
        const map = {};
        for (const cat of list) {
          map[cat.id] = cat.name;
        }
        setCategoriesMap(map);
      } catch {
        // Fallback sang categoryNames trong ProductRow nếu lỗi tải danh mục
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCategoryChange(e) {
    updateSearchParams({ category: e.target.value, page: 1 });
  }

  function handleStatusChange(e) {
    updateSearchParams({ status: e.target.value, page: 1 });
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === urlPage) return;
    updateSearchParams({ page: nextPage });
  }

  function handleRetry() {
    setReloadKey((k) => k + 1);
  }

  function handleEdit(product) {
    navigate(`/products/${product.id}/edit`);
  }

  function handleDeleteClick(product) {
    setDeleteTarget(product);
  }

  function handleCancelDelete() {
    if (deleting) return;
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToast('Đã xoá sản phẩm');
      setReloadKey((k) => k + 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Xoá sản phẩm thất bại';
      showToast(message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <h1 className="page-title">Sản phẩm</h1>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="add-button"
          onClick={() => navigate('/products/new')}
        >
          Thêm sản phẩm
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="search-input"
          data-testid="search-input"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên hoặc SKU..."
          aria-label="Tìm kiếm theo tên hoặc SKU"
        />

        <select
          className="filter-select"
          data-testid="category-filter"
          value={urlCategory}
          onChange={handleCategoryChange}
          aria-label="Lọc theo danh mục"
        >
          <option value="">Tất cả</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          data-testid="status-filter"
          value={urlStatus}
          onChange={handleStatusChange}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>
      </div>

      {loading && (
        <div className="state-box" data-testid="loading">
          Đang tải danh sách sản phẩm...
        </div>
      )}

      {!loading && error && (
        <div className="state-box state-error" data-testid="error-message">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            data-testid="retry-button"
            onClick={handleRetry}
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="state-box" data-testid="empty-state">
          Không có sản phẩm nào.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="table-card">
            <ProductTable
              products={products}
              categoriesMap={categoriesMap}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          </div>

          <div className="pagination" data-testid="pagination">
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="page-prev"
              disabled={urlPage <= 1}
              onClick={() => handlePageChange(urlPage - 1)}
            >
              Trước
            </button>
            <span className="page-current" data-testid="page-current">
              {urlPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="page-next"
              disabled={urlPage >= totalPages}
              onClick={() => handlePageChange(urlPage + 1)}
            >
              Sau
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        productName={deleteTarget?.name || ''}
        loading={deleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
