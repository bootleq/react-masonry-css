'use strict';

var React = require('react');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

const _excluded = ["breakpointCols", "className", "columnClassName", "children", "itemHeightProp", "columnAttrs", "column"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], t.indexOf(o) >= 0 || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (e.indexOf(n) >= 0) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const DEFAULT_COLUMNS = 2;
const reCalculateColumnCount = breakpointCols => {
  const windowWidth = window && window.innerWidth || Infinity;
  let breakpointColsObject = breakpointCols;

  // Allow passing a single number to `breakpointCols` instead of an object
  if (typeof breakpointColsObject !== "object") {
    breakpointColsObject = {
      default: parseInt(breakpointColsObject) || DEFAULT_COLUMNS
    };
  }
  let matchedBreakpoint = Infinity;
  let columns = breakpointColsObject.default || DEFAULT_COLUMNS;
  for (let breakpoint in breakpointColsObject) {
    const optBreakpoint = parseInt(breakpoint);
    const isCurrentBreakpoint = optBreakpoint > 0 && windowWidth <= optBreakpoint;
    if (isCurrentBreakpoint && optBreakpoint < matchedBreakpoint) {
      matchedBreakpoint = optBreakpoint;
      columns = breakpointColsObject[breakpoint];
    }
  }
  columns = Math.max(1, parseInt(columns) || 1);
  return columns;
};
const reCalculateColumnCountDebounce = (columnCountCallback, lastFrameRef) => {
  if (!window || !window.requestAnimationFrame) {
    // IE10+
    columnCountCallback();
  }
  if (window.cancelAnimationFrame) {
    // IE10+
    const lastFrame = lastFrameRef.current;
    window.cancelAnimationFrame(lastFrame);
  }
  lastFrameRef.current = window.requestAnimationFrame(columnCountCallback);
};
const moveOddItem = ctx => {
  const {
    itemsColumns,
    heights,
    refPropName
  } = ctx;
  const [minCol, maxCol] = heights.reduce((acc, num, index, arr) => {
    if (num < arr[acc[0]]) acc[0] = index;
    if (num > arr[acc[1]]) acc[1] = index;
    return acc;
  }, [0, 0]);
  const maxColItems = itemsColumns[maxCol];
  const oddHeight = maxColItems[maxColItems.length - 1].props[refPropName];

  // Move item unless target column will become longest afterward
  if (heights[minCol] + oddHeight < heights[maxCol]) {
    const item = maxColItems.pop();
    itemsColumns[minCol].push(item);
    heights[maxCol] -= oddHeight;
    heights[minCol] += oddHeight;
  } else {
    ctx.done = true;
  }
};
const balanceColumns = (itemsColumns, refPropName) => {
  const heights = itemsColumns.map(items => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      if (typeof items[i].props[refPropName] === 'number') {
        sum += items[i].props[refPropName];
      } else {
        return -1;
      }
    }
    return sum;
  });
  if (heights.some(h => h <= 0)) {
    return itemsColumns; // fail following height, return untouched
  }
  const ctx = {
    itemsColumns,
    heights,
    refPropName,
    done: false
  };
  while (!ctx.done) {
    moveOddItem(ctx);
  }
  return itemsColumns;
};
const itemsInColumns = (currentColumnCount, children) => {
  const itemsInColumns = new Array(currentColumnCount);

  // Force children to be handled as an array
  const items = React__default["default"].Children.toArray(children);
  for (let i = 0; i < items.length; i++) {
    const columnIndex = i % currentColumnCount;
    if (!itemsInColumns[columnIndex]) {
      itemsInColumns[columnIndex] = [];
    }
    itemsInColumns[columnIndex].push(items[i]);
  }
  return itemsInColumns;
};
const logDeprecated = message => {
  console.error("[Masonry]", message);
};
const renderColumns = (children, currentColumnCount, column, columnAttrs = {}, columnClassName, itemHeightProp) => {
  const childrenInColumns = itemsInColumns(currentColumnCount, children);
  if (itemHeightProp) {
    balanceColumns(childrenInColumns, itemHeightProp);
  }
  const columnWidth = `${100 / childrenInColumns.length}%`;
  let className = columnClassName;
  if (className && typeof className !== "string") {
    logDeprecated('The property "columnClassName" requires a string');

    // This is a deprecated default and will be removed soon.
    if (typeof className === "undefined") {
      className = "my-masonry-grid_column";
    }
  }
  const columnAttributes = _objectSpread(_objectSpread(_objectSpread({}, column), columnAttrs), {}, {
    style: _objectSpread(_objectSpread({}, columnAttrs.style), {}, {
      width: columnWidth
    }),
    className
  });
  return childrenInColumns.map((items, i) => {
    return /*#__PURE__*/React__default["default"].createElement("div", _extends({}, columnAttributes, {
      key: i
    }), items);
  });
};
const Masonry = _ref => {
  let {
      breakpointCols = undefined,
      // optional, number or object { default: number, [key: number]: number }
      className = undefined,
      // required, string
      columnClassName = undefined,
      // optional, string
      children = undefined,
      // Any React children. Typically an array of JSX items

      itemHeightProp = undefined,
      // optional, string

      // Custom attributes, however it is advised against
      // using these to prevent unintended issues and future conflicts
      // ...any other attribute, will be added to the container
      columnAttrs = undefined,
      // object, added to the columns

      // Deprecated props
      // The column property is deprecated.
      // It is an alias of the `columnAttrs` property
      column = undefined
    } = _ref,
    rest = _objectWithoutProperties(_ref, _excluded);
  const [columnCount, setColumnCount] = React__default["default"].useState(() => {
    let count;
    if (breakpointCols && breakpointCols.default) {
      count = breakpointCols.default;
    } else {
      count = parseInt(breakpointCols) || DEFAULT_COLUMNS;
    }
    return count;
  });
  const lastFrameRef = React__default["default"].useRef();
  const columnCountCallback = React__default["default"].useCallback(() => {
    const columns = reCalculateColumnCount(breakpointCols);
    if (columnCount !== columns) {
      setColumnCount(columns);
    }
  }, [breakpointCols, columnCount]);
  React__default["default"].useLayoutEffect(() => {
    columnCountCallback();
    const handleWindowResize = () => {
      reCalculateColumnCountDebounce(columnCountCallback, lastFrameRef);
    };
    // window may not be available in some environments
    if (window) {
      window.addEventListener("resize", handleWindowResize);
    }
    return () => {
      if (window) {
        window.removeEventListener("resize", handleWindowResize);
      }
    };
  }, [columnCountCallback]);
  let classNameOutput = className;
  if (typeof className !== "string") {
    logDeprecated('The property "className" requires a string');

    // This is a deprecated default and will be removed soon.
    if (typeof className === "undefined") {
      classNameOutput = "my-masonry-grid";
    }
  }
  return /*#__PURE__*/React__default["default"].createElement("div", _extends({}, rest, {
    className: classNameOutput
  }), renderColumns(children, columnCount, column, columnAttrs, columnClassName, itemHeightProp));
};

module.exports = Masonry;
