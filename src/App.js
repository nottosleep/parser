import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
    const [jsonKeys, setJsonKeys] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [missingKeys, setMissingKeys] = useState([]);
    const [missingTranslations, setMissingTranslations] = useState([]);
    const [jsonFileName, setJsonFileName] = useState('');
    const [csvFileName, setCsvFileName] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);

    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const tooltipRef = useRef(null);

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setJsonFileName(file.name);

        const fileReader = new FileReader();
        fileReader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const keys = Object.keys(json);
                setJsonKeys(keys);
            } catch (err) {
                alert('Невалидный JSON');
            }
        };
        fileReader.readAsText(file);
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setCsvFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvData(results.data);
            },
            error: () => {
                alert('Ошибка при чтении CSV');
            }
        });
    };

    const compareData = () => {
        if (csvData.length === 0 || jsonKeys.length === 0) {
            alert('Пожалуйста, загрузите оба файла.');
            return;
        }

        const csvKeys = csvData.map(row => row['SPA.key']?.trim()).filter(Boolean);
        const missing = jsonKeys.filter(key => !csvKeys.includes(key));
        setMissingKeys(missing);

        const translationIssues = [];
        const ignoredColumns = ['SPA.key', 'Default.key', 'Android.key', 'iOS.key', 'Brand', 'Tag'];
        const languageColumns = Object.keys(csvData[0]).filter(
            col => !ignoredColumns.includes(col)
        );

        jsonKeys.forEach(key => {
            const row = csvData.find(r => r['SPA.key']?.trim() === key);
            if (row) {
                const missingLangs = [];

                languageColumns.forEach(lang => {
                    const value = row[lang];
                    if (!value || value.toString().trim() === '') {
                        missingLangs.push(lang);
                    }
                });

                if (missingLangs.length > 0) {
                    translationIssues.push(
                        <div key={key}>
                            <b>{key}</b><br />
                            отсутствуют переводы для: {missingLangs.join(', ')}
                            <br /><br />
                        </div>
                    );
                }
            }
        });

        setMissingTranslations(translationIssues);
    };

    const listStyle = { listStyleType: 'none', paddingLeft: 0 };

    const btnPrimary = {
        backgroundColor: '#339af0',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s ease',
        marginRight: '10px',
        userSelect: 'none',
    };

    const btnPrimaryHover = { backgroundColor: '#228be6' };
    const btnSuccess = {
        backgroundColor: '#198754',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s ease',
        userSelect: 'none',
        marginTop: '10px',
    };
    const btnSuccessHover = { backgroundColor: '#146c43' };
    const btnDisabled = { backgroundColor: '#6c757d', cursor: 'not-allowed', opacity: 0.65 };

    const useHover = () => {
        const [hovered, setHovered] = useState(false);
        const onMouseEnter = () => setHovered(true);
        const onMouseLeave = () => setHovered(false);
        return [{ onMouseEnter, onMouseLeave }, hovered];
    };

    const [jsonBtnEvents, jsonBtnHovered] = useHover();
    const [csvBtnEvents, csvBtnHovered] = useHover();
    const [compareBtnEvents, compareBtnHovered] = useHover();

    const isCompareDisabled = !(jsonFileName && csvFileName);

    // Закрытие тултипа при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setShowTooltip(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', position: 'relative' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                Сравнение ключей и переводов
                <span
                    onClick={() => setShowTooltip(!showTooltip)}
                    style={{
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#339af0',
                        color: 'white',
                        textAlign: 'center',
                        lineHeight: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        userSelect: 'none'
                    }}
                >
                    ?
                </span>
                {showTooltip && (
                    <div
                        ref={tooltipRef}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '8px',
                            backgroundColor: '#f8f9fa',
                            color: '#333',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '10px',
                            width: '300px',
                            fontSize: '14px',
                            zIndex: 100,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        Загружаем в JSON fallback.json файл<br/>
                        Загружаем в CSV export.csv файл
                        <br/><br/>
                        fallback.json - это ключи, которые SPA фронтенд использует реально<br/>
                        export.csv - все переводы из админки
                        <br/><br/>
                        Выводится список отсутствующих переводов.<br/>
                        Проверка идет только по SPA.key
                    </div>
                )}
            </h2>

            <div style={{ marginBottom: '10px' }}>
                <input
                    type="file"
                    accept=".json"
                    ref={jsonInputRef}
                    style={{ display: 'none' }}
                    onChange={handleJsonUpload}
                />
                <button
                    style={{ ...btnPrimary, ...(jsonBtnHovered ? btnPrimaryHover : {}) }}
                    {...jsonBtnEvents}
                    onClick={() => jsonInputRef.current.click()}
                >
                    Загрузить JSON (SPA)
                </button>
                {jsonFileName && <div style={{ marginTop: '5px', color: 'green' }}>{jsonFileName}</div>}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="file"
                    accept=".csv"
                    ref={csvInputRef}
                    style={{ display: 'none' }}
                    onChange={handleCsvUpload}
                />
                <button
                    style={{ ...btnPrimary, ...(csvBtnHovered ? btnPrimaryHover : {}) }}
                    {...csvBtnEvents}
                    onClick={() => csvInputRef.current.click()}
                >
                    Загрузить CSV (админка)
                </button>
                {csvFileName && <div style={{ marginTop: '5px', color: 'green' }}>{csvFileName}</div>}
            </div>

            <button
                style={{
                    ...btnSuccess,
                    ...(compareBtnHovered && !isCompareDisabled ? btnSuccessHover : {}),
                    ...(isCompareDisabled ? btnDisabled : {}),
                }}
                {...compareBtnEvents}
                onClick={compareData}
                disabled={isCompareDisabled}
            >
                Сравнить
            </button>

            <div style={{ marginTop: '20px' }}>
                <h3>Отсутствующие ключи:</h3>
                {missingKeys.length === 0 ? (
                    <p>Все ключи присутствуют.</p>
                ) : (
                    <ul style={listStyle}>
                        {missingKeys.map((key, idx) => (
                            <li key={idx}>{key}</li>
                        ))}
                    </ul>
                )}

                <h3>Отсутствующие переводы:</h3>
                {missingTranslations.length === 0 ? (
                    <p>Все переводы заполнены.</p>
                ) : (
                    <ul style={listStyle}>
                        {missingTranslations.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default App;
