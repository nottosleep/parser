import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';

function Chevron({ open }) {
    return (
        <svg
            style={{
                width: 20,
                height: 20,
                transition: 'transform 0.3s ease',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                fill: '#999',
                marginLeft: 8,
                flexShrink: 0,
            }}
            viewBox="0 0 24 24"
        >
            <path d="M6 9l6 6 6-6z" />
        </svg>
    );
}

function CopyIcon({ onClick }) {
    return (
        <svg
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            style={{ cursor: 'pointer', marginLeft: 8, fill: '#888', flexShrink: 0 }}
        >
            <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 18H8V7h11v16z" />
        </svg>
    );
}

function App() {
    const [jsonKeys, setJsonKeys] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [missingKeys, setMissingKeys] = useState([]);
    const [missingTranslations, setMissingTranslations] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState(() => JSON.parse(localStorage.getItem('checkedKeys')) || []);
    const [checkedTranslationKeys, setCheckedTranslationKeys] = useState(() => JSON.parse(localStorage.getItem('checkedTranslationKeys')) || []);
    const [accordionOpen, setAccordionOpen] = useState(() => localStorage.getItem('accordionOpen') === 'true');
    const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(() => localStorage.getItem('accordionOpen2') === 'true');
    const [jsonFileName, setJsonFileName] = useState('');
    const [csvFileName, setCsvFileName] = useState('');

    const [ignoreColumns, setIgnoreColumns] = useState(() => JSON.parse(localStorage.getItem('ignoreColumns')) || []);

    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);

    // Получить все языковые колонки из CSV
    const ignoredCols = ['SPA.key', 'Default.key', 'Android.key', 'iOS.key', 'Brand', 'Tag', 'ID'];
    const langCols = csvData.length ? Object.keys(csvData[0]).filter(col => !ignoredCols.includes(col)) : [];
    console.log('langCols', langCols);
    useEffect(() => {
        localStorage.setItem('ignoreColumns', JSON.stringify(ignoreColumns));
    }, [ignoreColumns]);

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setJsonFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                setJsonKeys(Object.keys(json));
            } catch {
                alert('Невалидный JSON');
            }
        };
        reader.readAsText(file);
    };

    const handleCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => setCsvData(results.data),
            error: () => alert('Ошибка чтения CSV'),
        });
    };

    // Основная логика сравнения
    const compareData = () => {
        if (!jsonKeys.length || !csvData.length) {
            alert('Загрузите оба файла.');
            return;
        }
        const csvKeys = csvData.map(r => r['SPA.key']?.trim()).filter(Boolean);
        const missing = jsonKeys.filter(key => !csvKeys.includes(key));
        setMissingKeys(missing);

        const issues = [];
        // отфильтровать langCols с учётом игнорируемых колонок
        const filteredLangCols = langCols.filter(col => !ignoreColumns.includes(col));

        jsonKeys.forEach(key => {
            const row = csvData.find(r => r['SPA.key']?.trim() === key);
            if (row) {
                const missingLangs = filteredLangCols.filter(lang => !row[lang] || row[lang].trim() === '');
                if (missingLangs.length) {
                    issues.push({ key, langs: missingLangs });
                }
            }
        });

        setMissingTranslations(issues);
    };

    // Переключение выбранных игнорируемых колонок
    const toggleIgnoreColumn = (col) => {
        const updated = ignoreColumns.includes(col)
            ? ignoreColumns.filter(c => c !== col)
            : [...ignoreColumns, col];
        setIgnoreColumns(updated);
    };

    const toggleKeyChecked = (e, key) => {
        e.stopPropagation();
        const updated = checkedKeys.includes(key)
            ? checkedKeys.filter(k => k !== key)
            : [...checkedKeys, key];
        setCheckedKeys(updated);
        localStorage.setItem('checkedKeys', JSON.stringify(updated));
    };

    const toggleTranslationKeyChecked = (e, key) => {
        e.stopPropagation();
        const updated = checkedTranslationKeys.includes(key)
            ? checkedTranslationKeys.filter(k => k !== key)
            : [...checkedTranslationKeys, key];
        setCheckedTranslationKeys(updated);
        localStorage.setItem('checkedTranslationKeys', JSON.stringify(updated));
    };

    const clearLogs = () => {
        setMissingKeys([]);
        setMissingTranslations([]);
    };

    const clearChecked = () => {
        setCheckedKeys([]);
        setCheckedTranslationKeys([]);
        localStorage.removeItem('checkedKeys');
        localStorage.removeItem('checkedTranslationKeys');
    };

    const clearFilters = () => {
        setIgnoreColumns([]);
        localStorage.removeItem('ignoreColumns');
    };

    const toggleAccordion = () => {
        const next = !accordionOpen;
        setAccordionOpen(next);
        localStorage.setItem('accordionOpen', next);
    };

    const toggleFiltersAccordion = () => {
        setFiltersAccordionOpen(!filtersAccordionOpen);
        localStorage.setItem('accordionOpen2', !filtersAccordionOpen);
    };

    const btnBase = {
        padding: '10px 20px',
        borderRadius: 4,
        border: 'none',
        fontSize: 16,
        cursor: 'pointer',
        marginRight: 10,
        transition: 'background-color 0.3s ease',
    };

    return (
        <div style={{padding: 20, fontFamily: 'Arial'}}>
            <h2>Сравнение ключей и переводов</h2>

            <div style={{marginBottom: 10}}>
                <input type="file" accept=".json" ref={jsonInputRef} style={{display: 'none'}}
                       onChange={handleJsonUpload}/>
                <button
                    style={{...btnBase, backgroundColor: '#339af0', color: 'white'}}
                    onClick={() => jsonInputRef.current.click()}
                >
                    Загрузить JSON (SPA)
                </button>
                {jsonFileName && <div style={{marginTop: 5, color: 'green'}}>{jsonFileName}</div>}
            </div>

            <div style={{marginBottom: 20}}>
                <input type="file" accept=".csv" ref={csvInputRef} style={{display: 'none'}}
                       onChange={handleCsvUpload}/>
                <button
                    style={{...btnBase, backgroundColor: '#339af0', color: 'white'}}
                    onClick={() => csvInputRef.current.click()}
                >
                    Загрузить CSV (админка)
                </button>
                {csvFileName && <div style={{marginTop: 5, color: 'green'}}>{csvFileName}</div>}
            </div>

            <button
                style={{...btnBase, backgroundColor: '#198754', color: 'white'}}
                onClick={compareData}
                disabled={!jsonKeys.length || !csvData.length}
            >
                Сравнить
            </button>

            {/* Аккордеон для доп действий */}
            <div
                onClick={toggleAccordion}
                style={{
                    marginTop: 15,
                    padding: 10,
                    border: '1px solid #ccc',
                    borderRadius: '4px 4px 0 0',
                    backgroundColor: '#f1f1f1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 500,
                    color: '#333',
                    width: 370,
                    position: 'relative',
                }}
                aria-expanded={accordionOpen}
                aria-controls="extra-actions"
            >
                <span>Доп. действия</span>
                <div style={{position: 'absolute', top: 9, right: 8}}><Chevron open={accordionOpen}/></div>
            </div>

            {accordionOpen && (
                <div
                    id="extra-actions"
                    style={{
                        border: '1px solid #ccc',
                        borderTop: 'none',
                        borderRadius: '0 0 4px 4px',
                        backgroundColor: '#fafafa',
                        display: 'flex',
                        padding: 10,
                        flexWrap: 'wrap',
                        width: 370,
                    }}
                >
                    <button
                        style={{...btnBase, backgroundColor: '#f08080', color: '#333'}}
                        onClick={clearLogs}
                    >
                        Очистить логи
                    </button>
                    <button
                        style={{...btnBase, backgroundColor: '#d6c256', color: '#333'}}
                        onClick={clearChecked}
                    >
                        Сбросить выделеные
                    </button>
                    <button
                        style={{...btnBase, backgroundColor: '#339af0', color: 'white', marginTop: 10}}
                        onClick={clearFilters}
                    >
                        Сбросить фильтры
                    </button>
                </div>
            )}

            {/* Новый аккордеон: Фильтры игнорируемых колонок */}
            <div
                onClick={toggleFiltersAccordion}
                style={{
                    marginTop: 15,
                    padding: 10,
                    border: '1px solid #ccc',
                    borderRadius: '4px 4px 0 0',
                    backgroundColor: '#f1f1f1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 500,
                    color: '#333',
                    width: 370,
                    position: 'relative',
                }}
                aria-expanded={filtersAccordionOpen}
                aria-controls="filter-columns"
            >
                <span>Игнорировать переводы</span>
                <div style={{position: 'absolute', top: 9, right: 8}}><Chevron open={filtersAccordionOpen}/></div>
            </div>

            {filtersAccordionOpen && (
                <div
                    id="filter-columns"
                    style={{
                        border: '1px solid #ccc',
                        borderTop: 'none',
                        borderRadius: '0 0 4px 4px',
                        backgroundColor: '#fafafa',
                        padding: 10,
                        width: 370,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {langCols.length === 0 && <p>Загрузите CSV для отображения колонок.</p>}
                    {langCols.map(col => (
                        <label key={col} style={{display: 'flex', alignItems: 'center', marginBottom: 6, cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={ignoreColumns.includes(col)}
                                onChange={() => toggleIgnoreColumn(col)}
                                style={{marginRight: 8}}
                            />
                            {col}
                        </label>
                    ))}
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 30,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                }}
            >
                <div style={{flex: '1 1 400px', background: '#eee', paddingLeft: 8}}>
                    <h3>Отсутствующие ключи</h3>
                    {missingKeys.length === 0 ? (
                        <p>Все ключи присутствуют.</p>
                    ) : (
                        <ul style={{listStyle: 'none', paddingLeft: 0}}>
                            {missingKeys.map((key) => (
                                <li key={key} style={{marginBottom: 6}}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'default',
                                            marginBottom: 8,
                                        }}
                                        className="hover-copy"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checkedKeys.includes(key)}
                                            onChange={(e) => toggleKeyChecked(e, key)}
                                            style={{marginRight: 10, cursor: 'pointer'}}
                                        />
                                        <span
                                            style={{
                                                textDecoration: checkedKeys.includes(key) ? 'line-through' : 'none',
                                                color: checkedKeys.includes(key) ? 'gray' : 'black',
                                            }}
                                        >
                                            {key}
                                        </span>
                                        <span className="copy-icon">
                                            <CopyIcon onClick={() => navigator.clipboard.writeText(key)}/>
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{flex: '1 1 400px'}}>
                    <h3>Отсутствующие переводы</h3>
                    {missingTranslations.length === 0 ? (
                        <p>Переводы везде заполнены.</p>
                    ) : (
                        <ul style={{listStyle: 'none', paddingLeft: 0}}>
                            {missingTranslations.map(({key, langs}) => (
                                <li key={key} style={{marginBottom: 6}} className="hover-copy">
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'default',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checkedTranslationKeys.includes(key)}
                                            onChange={(e) => toggleTranslationKeyChecked(e, key)}
                                            style={{marginRight: 10, cursor: 'pointer'}}
                                        />
                                        <span
                                            style={{
                                                textDecoration: checkedTranslationKeys.includes(key) ? 'line-through' : 'none',
                                                color: checkedTranslationKeys.includes(key) ? 'gray' : 'black',
                                            }}
                                        >
                                            <b>{key}
                                                <span
                                                    className="copy-icon">
                                                    <CopyIcon onClick={() => navigator.clipboard.writeText(key)}/>
                                                </span>
                                            </b>
                                            <br/>
                                            <span>отсутствуют переводы для: {langs.join(', ')}</span>
                                            <br/><br/>
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 1024px) {
                    div[style*="flex-wrap: wrap"] {
                        flex-direction: column !important;
                        gap: 15px !important;
                    }
                }
                @media (min-width: 1025px) {
                    div[style*="flex-wrap: wrap"] > div {
                        margin-right: 10px;
                    }
                }
            `}</style>
            <style>{`
                .hover-copy .copy-icon {
                  opacity: 0;
                  transition: opacity 0.2s ease;
                  margin-top: 2px;
                }
                .copy-icon svg:active {
                    background-color: #ddd;
                    fill: '#aaa !important';
                }
                .hover-copy:hover .copy-icon {
                  opacity: 1;
                }
            `}</style>
        </div>
    );
}

export default App;
