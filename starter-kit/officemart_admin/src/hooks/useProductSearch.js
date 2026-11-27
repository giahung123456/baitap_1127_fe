import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/axiosClient.js';

export default function useProductSearch({
  q = '',
  category = '',
  status = '',
  page = 1,
  limit = 10,
  reloadKey = 0,
} = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const queryParams = { page, limit };
      const trimmedQ = typeof q === 'string' ? q.trim() : '';
      if (trimmedQ) queryParams.q = trimmedQ;
      if (category) queryParams.category = category;
      if (status) queryParams.status = status;

      try {
        const res = await api.get('/products', {
          params: queryParams,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setData(res.data.data || []);
        setTotal(res.data.total ?? 0);
      } catch (err) {
        if (
          controller.signal.aborted ||
          axios.isCancel(err) ||
          err.code === 'ERR_CANCELED' ||
          err.name === 'CanceledError'
        ) {
          return;
        }
        setError(
          err.response?.data?.message ||
            err.message ||
            'Không thể tải danh sách sản phẩm. Vui lòng thử lại.',
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [q, category, status, page, limit, reloadKey]);

  return { data, total, loading, error };
}

