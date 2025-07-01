// --- Начало файла App.jsx ---
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
    const [showClipboardMsg ,setShowClipboardMsg] = useState(null);
    const [showClipboardMsg2 ,setShowClipboardMsg2] = useState(null);

    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);

    const ignoredCols = ['SPA.key', 'Default.key', 'Android.key', 'iOS.key', 'Brand', 'Tag', 'ID'];
    const langCols = csvData.length ? Object.keys(csvData[0]).filter(col => !ignoredCols.includes(col)) : [];

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

    const compareData = () => {
        if (!jsonKeys.length || !csvData.length) {
            alert('Загрузите оба файла.');
            return;
        }
        const csvKeys = csvData.map(r => r['SPA.key']?.trim()).filter(Boolean);
        const missing = jsonKeys.filter(key => !csvKeys.includes(key));
        setMissingKeys(missing);

        const issues = [];
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
        const next = !filtersAccordionOpen;
        setFiltersAccordionOpen(next);
        localStorage.setItem('accordionOpen2', next);
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
        <div style={{ padding: 20, fontFamily: 'Arial' }}>
            <h2>Сравнение ключей и переводов</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: "column", position: 'relative' }}>
                    <button style={{ ...btnBase, backgroundColor: '#339af0', color: 'white' }} onClick={() => jsonInputRef.current.click()}>
                        Загрузить JSON (SPA)
                    </button>
                    <input type="file" accept=".json" ref={jsonInputRef} style={{ display: 'none' }} onChange={handleJsonUpload} />
                    {jsonFileName && <div style={{ color: 'green', marginTop: 4, marginLeft: 2, position: "absolute", top: '95%' }}>{jsonFileName}</div>}
                </div>

                <div style={{ display: 'flex', flexDirection: "column",  position: 'relative'}}>
                    <button style={{ ...btnBase, backgroundColor: '#339af0', color: 'white' }} onClick={() => csvInputRef.current.click()}>
                        Загрузить CSV (админка)
                    </button>
                    <input type="file" accept=".csv" ref={csvInputRef} style={{ display: 'none' }} onChange={handleCsvUpload} />
                    {csvFileName && <div style={{ color: 'green', marginTop: 4, marginLeft: 2, position: "absolute", top: '95%' }}>{csvFileName}</div>}
                </div>

                <div style={{ position: 'relative' }}>
                    <div onClick={toggleAccordion} style={{
                        ...btnBase,
                        backgroundColor: '#f1f1f1',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        position: 'relative',
                        border: '1px solid #ccc',
                        minWidth: 202,
                    }}>
                        Доп. действия
                        <Chevron open={accordionOpen} />
                    </div>
                    {accordionOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: '#fafafa',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            padding: 10,
                            zIndex: 1000,
                            width: 222,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>

                            <button style={{ ...btnBase, backgroundColor: '#f08080', color: '#333', marginBottom: 6, marginRight: 0 }} onClick={clearLogs}>
                                Очистить логи
                            </button>
                            <button style={{ ...btnBase, backgroundColor: '#d6c256', color: '#333', marginBottom: 6, marginRight: 0 }} onClick={clearChecked}>
                                Сбросить выделенные
                            </button>
                            <button style={{ ...btnBase, backgroundColor: '#339af0', color: 'white', marginBottom: 6, marginRight: 0 }} onClick={clearFilters}>
                                Сбросить фильтры
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative' }}>
                    <div onClick={toggleFiltersAccordion} style={{
                        ...btnBase,
                        backgroundColor: '#f1f1f1',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid #ccc',
                    }}>
                        Игнорировать переводы
                        <Chevron open={filtersAccordionOpen} />
                        <span style={{ borderRadius: '50%', color: "white", background: ignoreColumns?.length ? '#339af0' : 'transparent', width: 16, height: 16, fontSize: 14, textAlign: "center"}}>{ ignoreColumns?.length ? ignoreColumns.length : ''}</span>
                    </div>
                    {filtersAccordionOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: '#fafafa',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            padding: 10,
                            maxHeight: 200,
                            overflowY: 'auto',
                            zIndex: 1000,
                            width: 245
                        }}>
                            {langCols.length === 0 && <p>Загрузите CSV для отображения фильтров</p>}
                            {langCols.map(col => (
                                <label key={col} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                                    <input
                                        type="checkbox"
                                        checked={ignoreColumns.includes(col)}
                                        onChange={() => toggleIgnoreColumn(col)}
                                        style={{ marginRight: 8 }}
                                    />
                                    {col}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button style={{ ...btnBase, backgroundColor: '#198754', color: 'white', marginTop: 40 }} onClick={compareData} disabled={!jsonKeys.length || !csvData.length}>
                Сравнить
            </button>

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
                <div style={{ flex: '1 1 400px', background: '#eee', paddingLeft: 8 }}>
                    <h3>Отсутствующие ключи</h3>
                    {missingKeys.length === 0 ? (
                        <p>Все ключи присутствуют.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {missingKeys.map((key, index) => (
                                <li key={key} style={{ marginBottom: 6 }}>
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
                                            style={{ marginRight: 10, cursor: 'pointer' }}
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
                                            <CopyIcon onClick={() => {
                                                navigator.clipboard.writeText(key);
                                                setShowClipboardMsg(index);
                                                setTimeout(() => {
                                                    setShowClipboardMsg(null);
                                                }, 1000)
                                            }} />
                                        </span>
                                        { showClipboardMsg === index && <span style={{fontSize: 14, color: "green"}}>{'Ключ скопирован'}</span>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ flex: '1 1 400px' }}>
                    <h3>Отсутствующие переводы</h3>
                    {missingTranslations.length === 0 ? (
                        <p>Переводы везде заполнены.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            {missingTranslations.map(({ key, langs }, index) => (
                                <li key={key} style={{ marginBottom: 6 }} className="hover-copy">
                                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
                                        <input
                                            type="checkbox"
                                            checked={checkedTranslationKeys.includes(key)}
                                            onChange={(e) => toggleTranslationKeyChecked(e, key)}
                                            style={{ marginRight: 10, cursor: 'pointer' }}
                                        />
                                        <span
                                            style={{
                                                textDecoration: checkedTranslationKeys.includes(key) ? 'line-through' : 'none',
                                                color: checkedTranslationKeys.includes(key) ? 'gray' : 'black',
                                            }}
                                        >
                                            <b>{key}
                                                <span className="copy-icon">
                                            <CopyIcon onClick={() => {
                                                navigator.clipboard.writeText(key);
                                                setShowClipboardMsg2(index);
                                                setTimeout(() => {
                                                    setShowClipboardMsg2(null);
                                                }, 1000)
                                            }} />
                                        </span>
                                                { showClipboardMsg2 === index && <span style={{fontSize: 14, color: "green", fontWeight: 'normal'}}>{'Ключ скопирован'}</span>}
                                            </b>
                                            <br />
                                            <span>отсутствуют переводы для: {langs.join(', ')}</span>
                                            <br /><br />
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
                }
                .hover-copy:hover .copy-icon {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}

export default App;
