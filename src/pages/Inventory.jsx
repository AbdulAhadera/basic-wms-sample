import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Lock, Pencil, Plus, Trash2 } from 'lucide-react';

import { useStore } from '../store/StoreContext';
import {
    batchesFor,
    expiredQty,
    nextBatch,
    sellable,
    soonQty,
    status,
    value,
} from '../store/selectors';
import { date, datetime, inDays, money } from '../lib/format';
import { days, expired, today } from '../lib/expiry';
import { exportCSV } from '../lib/csv';
import {
    Badge,
    Confirm,
    Empty,
    Field,
    IntegerInput,
    MoneyInput,
    Modal,
    QtyInput,
} from '../components/UI';
import { allowsDecimal, qtyMessage, toMajor, toMinor, validMoney, validQty } from '../lib/qty';
import { UNITS } from '../data/products';
import { clone, move } from '../store/reducer';

export default function Inventory() {
    const { state: s, save, patch, admin, toast } = useStore();
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const [q, setQ] = useState('');
    const [search, setSearch] = useState('');
    const [cat, setCat] = useState('All');
    const [filter, setFilter] = useState('All');
    const [size, setSize] = useState(10);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState({ key: 'name', asc: true });
    const [selected, setSelected] = useState([]);
    const [drawer, setDrawer] = useState(params.get('product'));
    const [tab, setTab] = useState('Details');
    const [add, setAdd] = useState(false);
    const [edit, setEdit] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [cols, setCols] = useState(
        s.columns?.length
            ? s.columns
            : [
                'SKU',
                'Category',
                'Unit',
                'Qty',
                'Min',
                'Price',
                'Next expiry',
                'Stock value',
                'Status',
            ],
    );

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(q);
            setPage(1);
        }, 150);

        return () => clearTimeout(timeout);
    }, [q]);

    useEffect(() => {
        if (params.get('product')) {
            setDrawer(params.get('product'));
        }
    }, [params]);

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                event.key.toLowerCase() === 'n' &&
                admin &&
                !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)
            ) {
                setAdd(true);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [admin]);

    const rowValue = (product, key) => {
        if (key === 'Qty') return sellable(s, product.id);
        if (key === 'Stock value') return value(s, product.id);
        if (key === 'Min') return product.min;
        if (key === 'Price') return product.price;
        if (key === 'SKU') return product.sku;

        return product[key.toLowerCase()] || product.name;
    };

    const rows = s.products
        .filter((product) => {
            const matchesSearch = `${product.name} ${product.sku}`
                .toLowerCase()
                .includes(search.toLowerCase());
            const matchesCategory = cat === 'All' || product.category === cat;
            const productStatus = status(s, product);
            const productBatches = batchesFor(s, product.id);

            const matchesFilter =
                filter === 'All' ||
                productStatus === filter ||
                (filter === 'Low and Out' && productStatus !== 'OK') ||
                (filter === 'Expiring' &&
                    productBatches.some(
                        (batch) =>
                            batch.remaining &&
                            !expired(batch) &&
                            days(batch.expiryDate) <= 7,
                    )) ||
                (filter === 'Has expired' && expiredQty(s, product.id) > 0);

            return matchesSearch && matchesCategory && matchesFilter;
        })
        .sort((a, b) => {
            const x = rowValue(a, sort.key);
            const y = rowValue(b, sort.key);
            const comparison =
                typeof x === 'number'
                    ? x - y
                    : String(x).localeCompare(String(y));

            return comparison * (sort.asc ? 1 : -1);
        });

    const product = s.products.find((item) => item.id === drawer);
    const bs = product ? batchesFor(s, product.id) : [];

    function exportSelected(ids) {
        exportCSV(
            s.products
                .filter((item) => ids.includes(item.id))
                .map((item) => ({
                    name: item.name,
                    sku: item.sku,
                    category: item.category,
                    unit: item.unit,
                    qty: sellable(s, item.id),
                    min_stock: item.min,
                    price: toMajor(item.price),
                    stock_value: toMajor(value(s, item.id)),
                })),
            `WMS-inventory-${today()}.csv`,
        );

        toast('Inventory exported');
    }

    function removeProducts(ids) {
        const hasRemainingStock = ids.some((id) =>
            batchesFor(s, id).some((batch) => batch.remaining),
        );

        if (hasRemainingStock) {
            toast('Remove remaining stock first');
            return;
        }

        save({
            ...s,
            products: s.products.filter((item) => !ids.includes(item.id)),
        });
        setSelected([]);
        setDrawer(null);
        toast('Products deleted');
    }

    function changeSort(key) {
        setSort({ key, asc: !sort.asc });
    }

    return (
        <>
            <div className="toolbar" id="tour-inventory">
                <input
                    aria-label="Search inventory"
                    placeholder="Search name or SKU"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                />

                <select
                    aria-label="Category"
                    value={cat}
                    onChange={(event) => {
                        setCat(event.target.value);
                        setPage(1);
                    }}
                >
                    <option>All</option>
                    {s.categories.map((category) => (
                        <option key={category}>{category}</option>
                    ))}
                </select>

                <select
                    aria-label="Status"
                    value={filter}
                    onChange={(event) => {
                        setFilter(event.target.value);
                        setPage(1);
                    }}
                >
                    {[
                        'All',
                        'OK',
                        'Low',
                        'Out',
                        'Low and Out',
                        'Expiring',
                        'Has expired',
                    ].map((option) => (
                        <option key={option}>{option}</option>
                    ))}
                </select>

                <button
                    title={admin ? 'Add product' : 'Admin only'}
                    disabled={!admin}
                    className="primary"
                    onClick={() => setAdd(true)}
                >
                    <Plus />
                    Add product
                </button>
            </div>

            <div className="toolbar">
                <select
                    aria-label="Saved views"
                    defaultValue=""
                    onChange={(event) => {
                        const selectedView = event.target.value;

                        if (selectedView === 'low') {
                            setFilter('Low and Out');
                        } else if (selectedView === 'expiry') {
                            setFilter('Expiring');
                        } else if (selectedView === 'dairy') {
                            setCat('Dairy & Eggs');
                        } else {
                            const view = s.views.find(
                                (item) => item.name === selectedView,
                            );

                            if (view) {
                                setCat(view.cat);
                                setFilter(view.filter);
                            }
                        }

                        setPage(1);
                    }}
                >
                    <option value="">Saved views</option>
                    <option value="low">Low and Out only</option>
                    <option value="expiry">Expiring in 7 days</option>
                    <option value="dairy">Dairy &amp; Eggs</option>
                    {s.views.map((view) => (
                        <option key={view.name} value={view.name}>
                            {view.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={() => {
                        const name = window.prompt('View name');

                        if (name) {
                            patch({
                                views: [
                                    ...s.views.filter((view) => view.name !== name),
                                    { name, cat, filter },
                                ],
                            });
                            toast('View saved');
                        }
                    }}
                >
                    Save current view
                </button>

                <details className="columns">
                    <summary>Columns</summary>
                    <div>
                        {[
                            'SKU',
                            'Category',
                            'Unit',
                            'Qty',
                            'Min',
                            'Price',
                            'Next expiry',
                            'Stock value',
                            'Status',
                        ].map((column) => (
                            <label key={column}>
                                <input
                                    type="checkbox"
                                    checked={cols.includes(column)}
                                    onChange={() => {
                                        const nextColumns = cols.includes(column)
                                            ? cols.filter((item) => item !== column)
                                            : [...cols, column];

                                        setCols(nextColumns);
                                        patch({ columns: nextColumns });
                                    }}
                                />
                                {column}
                            </label>
                        ))}
                    </div>
                </details>

                {selected.length > 0 && (
                    <>
                        <span>{selected.length} selected</span>
                        <button onClick={() => exportSelected(selected)}>
                            <Download />
                            Export
                        </button>
                        <button
                            disabled={!admin}
                            title={admin ? 'Delete' : 'Admin only'}
                            onClick={() => setConfirm(selected)}
                        >
                            <Trash2 />
                            Delete
                        </button>
                    </>
                )}
            </div>

            <div className="tablewrap">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">
                                <input
                                    aria-label="Select all"
                                    type="checkbox"
                                    checked={
                                        rows.length > 0 &&
                                        rows.every((item) => selected.includes(item.id))
                                    }
                                    onChange={(event) =>
                                        setSelected(
                                            event.target.checked
                                                ? rows.map((item) => item.id)
                                                : [],
                                        )
                                    }
                                />
                            </th>
                            <th scope="col" onClick={() => changeSort('name')}>
                                NAME {sort.key === 'name' && (sort.asc ? '↑' : '↓')}
                            </th>
                            {cols.map((column) => (
                                <th
                                    scope="col"
                                    key={column}
                                    className={
                                        ['Qty', 'Min', 'Price', 'Stock value'].includes(
                                            column,
                                        )
                                            ? 'numeric'
                                            : ''
                                    }
                                    onClick={() => changeSort(column)}
                                >
                                    {column}{' '}
                                    {sort.key === column &&
                                        (sort.asc ? '↑' : '↓')}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows
                            .slice((page - 1) * size, page * size)
                            .map((item) => {
                                const next = batchesFor(s, item.id)
                                    .filter(
                                        (batch) =>
                                            batch.remaining && !expired(batch),
                                    )
                                    .sort((a, b) =>
                                        (a.expiryDate || 'z').localeCompare(
                                            b.expiryDate || 'z',
                                        ),
                                    )[0];

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => {
                                            setDrawer(item.id);
                                            setTab('Details');
                                        }}
                                    >
                                        <td onClick={(event) => event.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                aria-label={`Select ${item.name}`}
                                                checked={selected.includes(item.id)}
                                                onChange={(event) =>
                                                    setSelected(
                                                        event.target.checked
                                                            ? [...selected, item.id]
                                                            : selected.filter(
                                                                (id) => id !== item.id,
                                                            ),
                                                    )
                                                }
                                            />
                                        </td>

                                        <td>
                                            {item.image ? (
                                                <img
                                                    className="product-image"
                                                    src={item.image}
                                                    alt=""
                                                />
                                            ) : (
                                                <span className="category-square">
                                                    {item.category[0]}
                                                </span>
                                            )}
                                            {item.name}
                                        </td>

                                        {cols.map((column) => (
                                            <td
                                                key={column}
                                                className={
                                                    [
                                                        'Qty',
                                                        'Min',
                                                        'Price',
                                                        'Stock value',
                                                    ].includes(column)
                                                        ? 'numeric'
                                                        : column === 'SKU'
                                                            ? 'mono'
                                                            : ''
                                                }
                                            >
                                                {column === 'Status' ? (
                                                    <>
                                                        <Badge>{status(s, item)}</Badge>
                                                        {soonQty(s, item.id) > 0 && <Badge>Expiring</Badge>}
                                                        {expiredQty(s, item.id) > 0 && (
                                                            <Badge>
                                                                Expired:{' '}
                                                                {expiredQty(s, item.id)}
                                                            </Badge>
                                                        )}
                                                    </>
                                                ) : column === 'Next expiry' ? (
                                                    next?.expiryDate ? (
                                                        <>
                                                            <span>{date(next.expiryDate)}</span>
                                                            <small
                                                                className={
                                                                    days(next.expiryDate) <= 7
                                                                        ? 'amber-text'
                                                                        : ''
                                                                }
                                                            >
                                                                {inDays(days(next.expiryDate))}
                                                            </small>
                                                        </>
                                                    ) : (
                                                        '—'
                                                    )
                                                ) : column === 'Price' ? (
                                                    money(item.price)
                                                ) : column === 'Stock value' ? (
                                                    money(value(s, item.id))
                                                ) : (
                                                    rowValue(item, column)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>

                {!rows.length && <Empty>No matching products.</Empty>}
            </div>

            <div className="toolbar">
                <span>{rows.length} products</span>

                <select
                    aria-label="Rows per page"
                    value={size}
                    onChange={(event) => {
                        setSize(Number(event.target.value));
                        setPage(1);
                    }}
                >
                    {[10, 25, 50].map((number) => (
                        <option key={number} value={number}>
                            {number}
                        </option>
                    ))}
                </select>

                <button
                    disabled={page === 1}
                    onClick={() => setPage((current) => current - 1)}
                >
                    Previous
                </button>

                <span>
                    {page} / {Math.max(1, Math.ceil(rows.length / size))}
                </span>

                <button
                    disabled={page * size >= rows.length}
                    onClick={() => setPage((current) => current + 1)}
                >
                    Next
                </button>
            </div>

            {product && (
                <Modal
                    title={product.name}
                    drawer
                    onClose={() => setDrawer(null)}
                >
                    <div className="tabs">
                        {['Details', 'Batches', 'History'].map((item) => (
                            <button
                                key={item}
                                className={tab === item ? 'selected' : ''}
                                onClick={() => setTab(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {tab === 'Details' ? (
                        <>
                            <dl>
                                {Object.entries({
                                    SKU: product.sku,
                                    Category: product.category,
                                    Unit: product.unit,
                                    'Sellable quantity': sellable(s, product.id),
                                    'Minimum stock': product.min,
                                    Price: money(product.price),
                                    'Stock value': money(value(s, product.id)),
                                }).map(([label, detail]) => (
                                    <React.Fragment key={label}>
                                        <dt>{label}</dt>
                                        <dd>{detail}</dd>
                                    </React.Fragment>
                                ))}
                            </dl>

                            <div className="lockedrow">
                                <Lock />
                                Per-product costing method (Advance)
                            </div>

                            <div className="actions">
                                <button
                                    disabled={!admin}
                                    title={admin ? 'Edit' : 'Admin only'}
                                    onClick={() => setEdit(true)}
                                >
                                    <Pencil />
                                    Edit
                                </button>

                                <button
                                    disabled={!admin}
                                    title={admin ? 'Delete' : 'Admin only'}
                                    onClick={() => setConfirm([product.id])}
                                >
                                    <Trash2 />
                                    Delete
                                </button>

                                <Link
                                    className="button primary"
                                    to={`/movement?tab=IN&product=${product.id}`}
                                >
                                    Stock In
                                </Link>

                                <Link
                                    className="button"
                                    to={`/movement?tab=OUT&product=${product.id}`}
                                >
                                    Stock Out
                                </Link>
                            </div>
                        </>
                    ) : tab === 'Batches' ? (
                        bs
                            .filter((batch) => batch.remaining > 0)
                            .map((batch) => (
                                <section className="card" key={batch.id}>
                                    <div className="row">
                                        <b>{batch.id}</b>
                                        {nextBatch(s, product.id)?.id === batch.id && (
                                            <Badge>Next out</Badge>
                                        )}
                                        {expired(batch) && <Badge>Expired</Badge>}
                                    </div>

                                    <dl>
                                        <dt>Received</dt>
                                        <dd>{date(batch.receivedDate)}</dd>
                                        <dt>Received / remaining</dt>
                                        <dd>
                                            {batch.qtyReceived} / {batch.remaining}
                                        </dd>
                                        <dt>Unit cost</dt>
                                        <dd>{money(batch.unitCost)}</dd>
                                        <dt>Expiry</dt>
                                        <dd>{date(batch.expiryDate)}</dd>
                                        <dt>Supplier</dt>
                                        <dd>{batch.supplier}</dd>
                                    </dl>

                                    {expired(batch) && (
                                        <button
                                            disabled={!admin}
                                            title={admin ? 'Write off' : 'Admin only'}
                                            onClick={() =>
                                                navigate(
                                                    `/adjustments?product=${product.id}&batch=${batch.id}&qty=${batch.remaining}&reason=Expired`,
                                                )
                                            }
                                        >
                                            Write off
                                        </button>
                                    )}
                                </section>
                            ))
                    ) : (
                        s.movements
                            .filter((movement) => movement.productId === product.id)
                            .slice()
                            .reverse()
                            .map((movement) => (
                                <div className="listrow" key={movement.id}>
                                    <Badge>{movement.type}</Badge>
                                    <span>
                                        {movement.qty} · {money(movement.totalCost)}
                                        <small>{datetime(movement.datetime)}</small>
                                    </span>
                                </div>
                            ))
                    )}
                </Modal>
            )}

            {(add || edit) && (
                <ProductForm
                    product={edit ? product : null}
                    onClose={() => {
                        setAdd(false);
                        setEdit(false);
                    }}
                />
            )}

            {confirm && (
                <Confirm
                    title="Delete products"
                    text="Delete the selected products? Products with remaining stock cannot be deleted."
                    destructive
                    onClose={() => setConfirm(null)}
                    onConfirm={() => removeProducts(confirm)}
                />
            )}
        </>
    );
}

function ProductForm({ product, onClose }) {
    const { state: s, save, admin, toast } = useStore();

    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [f, setF] = useState(
        product ? { ...product, price: toMajor(product.price) } : {
            name: '',
            sku: '',
            category: s.categories[0],
            unit: 'pack',
            min: '',
            price: '',
            qty: '',
            unitCost: '',
            receivedDate: today(),
            expiryDate: '',
            supplier: '',
            reference: '',
        },
    );
    const [newCategory, setNewCategory] = useState('');
    const [perishableCategory, setPerishableCategory] = useState(false);
    const [newCategoryOpen, setNewCategoryOpen] = useState(false);

    const set = (key, nextValue) =>
        setF((current) => ({ ...current, [key]: nextValue }));

    function validate() {
        if (!f.name || !f.sku || !f.category || !f.unit) {
            throw new Error('Complete all required fields');
        }

        if (
            s.products.some(
                (item) =>
                    item.id !== product?.id &&
                    item.sku.toLowerCase() === f.sku.toLowerCase(),
            )
        ) {
            throw new Error('SKU already exists. Stock In instead?');
        }

        if (!Number.isInteger(Number(f.min)) || Number(f.min) < 1) {
            throw new Error('Minimum stock must be a whole number');
        }

        if (!validMoney(f.price)) {
            throw new Error('Enter the price, for example 4.49');
        }

        if (!product && step >= 2) {
            if (!validQty(Number(f.qty), f.unit)) {
                throw new Error(qtyMessage(allowsDecimal(f.unit)));
            }

            if (!validMoney(f.unitCost)) {
                throw new Error('Enter the unit cost, for example 3.25');
            }
        }

        if (!product && step >= 2) {
            if (f.receivedDate > today()) {
                throw new Error('Received date cannot be in the future');
            }

            if (s.perishables.includes(f.category) && !f.expiryDate) {
                throw new Error('Expiry is required');
            }

            if (f.expiryDate && f.expiryDate <= f.receivedDate) {
                throw new Error('Expiry must be after received date');
            }
        }
    }

    function submit(mode) {
        try {
            validate();

            if (!admin) {
                throw new Error('Admin only');
            }

            if (step < 3 && !product) {
                setStep((current) => current + 1);
                setError('');
                return;
            }

            setBusy(true);

            setTimeout(() => {
                try {
                    let next = clone(s);
                    const nextProduct = {
                        ...f,
                        id: product?.id || `p${Date.now()}`,
                        min: Number(f.min),
                        price: toMinor(f.price),
                        perishable: s.perishables.includes(f.category),
                        shelf: 30,
                    };

                    delete nextProduct.qty;
                    delete nextProduct.unitCost;

                    if (product) {
                        next.products = next.products.map((item) =>
                            item.id === nextProduct.id ? nextProduct : item,
                        );
                    } else {
                        next.products.push(nextProduct);
                        next = move(next, {
                            ...f,
                            productId: nextProduct.id,
                            qty: Number(f.qty),
                            unitCost: toMinor(f.unitCost),
                            type: 'OPENING',
                        }).state;
                    }

                    save(next);
                    toast(product ? 'Product updated' : 'Product added');

                    if (mode === 'another') {
                        setF({
                            ...f,
                            name: '',
                            sku: '',
                            qty: '',
                            unitCost: '',
                        });
                        setStep(1);
                    } else {
                        onClose();

                        if (mode === 'print') {
                            window.location.hash = `/labels?product=${nextProduct.id}`;
                        }
                    }
                } catch (submitError) {
                    setError(submitError.message);
                }

                setBusy(false);
            }, 300);
        } catch (validationError) {
            setError(validationError.message);
        }
    }

    return (
        <Modal
            title={product ? 'Edit product' : `Add product · Step ${step} of 3`}
            onClose={onClose}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                {step === 1 ? (
                    <>
                        <Field label="Name" required>
                            <input
                                value={f.name}
                                onChange={(event) => set('name', event.target.value)}
                            />
                        </Field>

                        <Field label="SKU" required>
                            <input
                                value={f.sku}
                                onChange={(event) => set('sku', event.target.value)}
                            />
                        </Field>

                        <button
                            type="button"
                            onClick={() =>
                                set(
                                    'sku',
                                    `${f.category.slice(0, 3).toUpperCase()}-${s.products.length + 1001
                                    }`,
                                )
                            }
                        >
                            Auto-generate SKU
                        </button>

                        <Field label="Category" required>
                            <select
                                value={f.category}
                                onChange={(event) => set('category', event.target.value)}
                            >
                                {s.categories.map((category) => (
                                    <option key={category}>{category}</option>
                                ))}
                            </select>
                        </Field>

                        <button
                            type="button"
                            onClick={() => setNewCategoryOpen((open) => !open)}
                        >
                            New category
                        </button>

                        {newCategoryOpen && (
                            <div className="preview">
                                <Field label="Category name" required>
                                    <input
                                        value={newCategory}
                                        onChange={(event) =>
                                            setNewCategory(event.target.value)
                                        }
                                    />
                                </Field>

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={perishableCategory}
                                        onChange={(event) =>
                                            setPerishableCategory(event.target.checked)
                                        }
                                    />
                                    Perishable (expiry required)
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const name = newCategory.trim();

                                        if (!name) {
                                            setError('Category name is required');
                                            return;
                                        }

                                        if (
                                            s.categories.some(
                                                (category) =>
                                                    category.toLowerCase() ===
                                                    name.toLowerCase(),
                                            )
                                        ) {
                                            setError('Category already exists');
                                            return;
                                        }

                                        save({
                                            ...s,
                                            categories: [...s.categories, name],
                                            perishables: perishableCategory
                                                ? [...s.perishables, name]
                                                : s.perishables,
                                        });
                                        set('category', name);
                                        setNewCategoryOpen(false);
                                        toast('Category added');
                                    }}
                                >
                                    Create category
                                </button>
                            </div>
                        )}

                        <Field label="Image (optional)">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                    const file = event.target.files[0];
                                    if (!file) return;

                                    if (file.size > 1000000) {
                                        setError('Choose an image under 1 MB');
                                        return;
                                    }

                                    const reader = new FileReader();
                                    reader.onload = () => set('image', reader.result);
                                    reader.readAsDataURL(file);
                                }}
                            />
                        </Field>

                        <Field label="Unit" required>
                            <select
                                value={f.unit}
                                onChange={(event) => set('unit', event.target.value)}
                            >
                                {UNITS.map((unit) => (
                                    <option key={unit}>{unit}</option>
                                ))}
                            </select>
                        </Field>

                        {['min', 'price'].map((key) => (
                            <Field
                                key={key}
                                label={key === 'min' ? 'Minimum stock' : 'Price'}
                                required
                            >
                                {key === 'price' ? (
                                    <MoneyInput
                                        placeholder="0.00"
                                        value={f[key]}
                                        onChange={(event) => set(key, event.target.value)}
                                    />
                                ) : (
                                    <IntegerInput
                                        value={f[key]}
                                        onChange={(event) => set(key, event.target.value)}
                                    />
                                )}
                            </Field>
                        ))}
                    </>
                ) : step === 2 ? (
                    <>
                        {['qty', 'unitCost'].map((key) => (
                            <Field
                                key={key}
                                label={key === 'qty' ? 'Opening quantity' : 'Unit cost'}
                                required
                            >
                                {key === 'qty' ? (
                                    <QtyInput
                                        unit={f.unit}
                                        placeholder={`Number of ${f.unit}`}
                                        value={f[key]}
                                        onChange={(event) => set(key, event.target.value)}
                                    />
                                ) : (
                                    <MoneyInput
                                        placeholder="0.00"
                                        value={f[key]}
                                        onChange={(event) => set(key, event.target.value)}
                                    />
                                )}
                            </Field>
                        ))}

                        {['receivedDate', 'expiryDate', 'supplier', 'reference'].map(
                            (key) => (
                                <Field
                                    key={key}
                                    label={
                                        {
                                            receivedDate: 'Received date',
                                            expiryDate: 'Expiry date',
                                            supplier: 'Supplier',
                                            reference: 'Reference',
                                        }[key]
                                    }
                                    required={
                                        key === 'expiryDate' &&
                                        s.perishables.includes(f.category)
                                    }
                                >
                                    <input
                                        type={key.endsWith('Date') ? 'date' : 'text'}
                                        value={f[key]}
                                        onChange={(event) => set(key, event.target.value)}
                                    />
                                </Field>
                            ),
                        )}
                    </>
                ) : (
                    <dl>
                        {Object.entries(f).map(([key, detail]) => (
                            <React.Fragment key={key}>
                                <dt>{key}</dt>
                                <dd>{detail}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                )}

                {error && (
                    <p className="error" role="alert">
                        {error}{' '}
                        {error.startsWith('SKU already') && (
                            <Link to="/movement?tab=IN">Stock In instead</Link>
                        )}
                    </p>
                )}

                <div className="actions">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep((current) => current - 1)}
                        >
                            Back
                        </button>
                    )}

                    <button disabled={busy} className="primary">
                        {busy ? 'Saving…' : product || step === 3 ? 'Save' : 'Next'}
                    </button>

                    {step === 3 && (
                        <>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => submit('another')}
                            >
                                Save and add another
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => submit('print')}
                            >
                                Save and print label
                            </button>
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
}