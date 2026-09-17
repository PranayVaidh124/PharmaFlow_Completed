import React, { useEffect, useState } from 'react';
import { getHistory } from '../api/dispensingApi';
import { errorText } from '../utils/format';
import Pagination from '../components/Pagination';

export default function DispensingHistory() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');

    getHistory({ page, limit: 10 })
      .then((response) => {
        setData(response.data.data || []);
        setPagination(response.data.pagination || null);
      })
      .catch((err) => {
        setError(errorText(err));
      });
  }, [page]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Dispensing History</h2>
          <p className="muted">
            Every successful transaction records its exact batch allocations.
          </p>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-box">{error}</div>}

        {data.length > 0 ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medicine</th>
                    <th>Quantity</th>
                    <th>Pharmacist</th>
                    <th>Batch Allocations</th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : '—'}
                      </td>

                      <td className="strong">
                        {item.medicine?.name || '—'}
                      </td>

                      <td>{item.quantity}</td>

                      <td>{item.user?.name || '—'}</td>

                      <td>
                        {Array.isArray(item.batchAllocations) &&
                        item.batchAllocations.length > 0 ? (
                          item.batchAllocations.map((allocation) => (
                            <div key={allocation.batchId}>
                              {allocation.batchNumber} →{' '}
                              {allocation.quantity}
                            </div>
                          ))
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              onPage={setPage}
            />
          </>
        ) : (
          <div className="empty">
            <h3>No dispensing history</h3>
            <p>
              Successful dispensing transactions will appear here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}