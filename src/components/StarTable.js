import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

const StarTable = () => {
  const [stars, setStars] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    // Lire les 1000 premières lignes du fichier CSV local
    const fetchStarsFromCSV = async () => {
      const response = await fetch('/hygdata_cleaned.csv'); // Le fichier est dans /public
      const csvText = await response.text();

      // Parse le CSV avec PapaParse, limite à 1000 lignes
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        preview: 1000, // Limite le nombre de lignes lues
        complete: (result) => {
          setStars(result.data); // Charger les données dans l'état
        },
        error: (error) => {
          console.error("Erreur lors du parsing du fichier CSV :", error);
        },
      });
    };

    fetchStarsFromCSV();
  }, []);

  // Fonction pour trier les étoiles
  const sortStars = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });

    const sortedStars = [...stars].sort((a, b) => {
      const aValue = parseFloat(a[key]);
      const bValue = parseFloat(b[key]);

      if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
      return 0;
    });

    setStars(sortedStars);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Tableau des Étoiles </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th
              style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd', backgroundColor: '#1e3a8a', color: 'white' }}
              onClick={() => sortStars('dist')}
            >
              Distance (AL) {sortConfig.key === 'dist' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th
              style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd', backgroundColor: '#2563eb', color: 'white' }}
              onClick={() => sortStars('mag')}
            >
              Magnitude {sortConfig.key === 'mag' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th
              style={{ cursor: 'pointer', padding: '10px', border: '1px solid #ddd', backgroundColor: '#1e3a8a', color: 'white' }}
              onClick={() => sortStars('absmag')}
            >
              Luminosité Absolue {sortConfig.key === 'absmag' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
            </th>
            <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#2563eb', color: 'white' }}>RA (Ascension Droite)</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#1e3a8a', color: 'white' }}>DEC (Déclinaison)</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#2563eb', color: 'white' }}>Type Spectral</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', backgroundColor: '#1e3a8a', color: 'white' }}>Position (X, Y, Z)</th>
          </tr>
        </thead>
        <tbody>
          {stars.map((star, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f0f8ff' : '#ffffff' }}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{parseFloat(star.dist).toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{parseFloat(star.mag).toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{parseFloat(star.absmag).toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{parseFloat(star.ra).toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{parseFloat(star.dec).toFixed(2)}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{star.spect || 'Undefined'}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                ({parseFloat(star.x).toFixed(2)}, {parseFloat(star.y).toFixed(2)}, {parseFloat(star.z).toFixed(2)})
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StarTable;
