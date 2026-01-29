'use client' // Wajib menambahkan ini karena kita pakai useEffect

import React, { useEffect, useState } from 'react'

const TestPage = () => {
  const [data, setData] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk memanggil API yang baru kita buat
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sheets'); // Panggil endpoint route kita
        const json = await res.json();
        
        if (json.data) {
          setData(json.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading data spreadsheet...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Integrasi API Route Spreadsheet</h1>
      
      {/* Tampilkan JSON Raw */}
      <div className="bg-gray-100 p-4 rounded overflow-auto border">
        <pre className="text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* Contoh Tabel Sederhana */}
      {data && (
        <table className="mt-4 w-full border text-sm">
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="border p-2">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TestPage