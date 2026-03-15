import React, { useState, useEffect } from 'react';
import { attendanceFaceService } from '../services/api';

const AttendanceFaceList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    limit: 50,
    page: 1
  });

  // Attendance ro'yxatini olish
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await attendanceFaceService.getAll(filters);
      setData(res.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test attendance yaratish
  const handleTest = async () => {
    try {
      await attendanceFaceService.testCreate({ employeeNo: 'TEST001' });
      fetchData(); // Ro'yxatni yangilash
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return (
    <div>
      <h1>Face Attendance</h1>
      <button onClick={handleTest}>Test Create</button>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee No</th>
              <th>Verify Mode</th>
              <th>Event Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.employeeNo}</td>
                <td>{item.verifyMode}</td>
                <td>{new Date(item.eventTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceFaceList;