import React from "react";

const DEFAULT_COLUMNS = 2;

const reCalculateColumnCount = (breakpointCols) => {
  const windowWidth = (window && window.innerWidth) || Infinity;
  let breakpointColsObject = breakpointCols;

  // Allow passing a single number to `breakpointCols` instead of an object
  if (typeof breakpointColsObject !== "object") {
    breakpointColsObject = {
      default: parseInt(breakpointColsObject) || DEFAULT_COLUMNS,
    };
  }

  let matchedBreakpoint = Infinity;
  let columns = breakpointColsObject.default || DEFAULT_COLUMNS;

  for (let breakpoint in breakpointColsObject) {
    const optBreakpoint = parseInt(breakpoint);
    const isCurrentBreakpoint =
      optBreakpoint > 0 && windowWidth <= optBreakpoint;

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

const moveOddItem = (ctx) => {
  const { itemsColumns, heights, refPropName } = ctx;

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
  const items = React.Children.toArray(children);

  for (let i = 0; i < items.length; i++) {
    const columnIndex = i % currentColumnCount;

    if (!itemsInColumns[columnIndex]) {
      itemsInColumns[columnIndex] = [];
    }

    itemsInColumns[columnIndex].push(items[i]);
  }

  return itemsInColumns;
};

const logDeprecated = (message) => {
  console.error("[Masonry]", message);
};

const renderColumns = (
  children,
  currentColumnCount,
  column,
  columnAttrs = {},
  columnClassName,
  itemHeightProp
) => {
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

  const columnAttributes = {
    // NOTE: the column property is undocumented and considered deprecated.
    // It is an alias of the `columnAttrs` property
    ...column,
    ...columnAttrs,
    style: {
      ...columnAttrs.style,
      width: columnWidth,
    },
    className,
  };

  return childrenInColumns.map((items, i) => {
    return (
      <div {...columnAttributes} key={i}>
        {items}
      </div>
    );
  });
};

const Masonry = ({
  breakpointCols = undefined, // optional, number or object { default: number, [key: number]: number }
  className = undefined, // required, string
  columnClassName = undefined, // optional, string
  children = undefined, // Any React children. Typically an array of JSX items

  itemHeightProp = undefined, // optional, string

  // Custom attributes, however it is advised against
  // using these to prevent unintended issues and future conflicts
  // ...any other attribute, will be added to the container
  columnAttrs = undefined, // object, added to the columns

  // Deprecated props
  // The column property is deprecated.
  // It is an alias of the `columnAttrs` property
  column = undefined,
  ...rest
}) => {
  const [columnCount, setColumnCount] = React.useState(() => {
    let count;
    if (breakpointCols && breakpointCols.default) {
      count = breakpointCols.default;
    } else {
      count = parseInt(breakpointCols) || DEFAULT_COLUMNS;
    }
    return count;
  });

  const lastFrameRef = React.useRef();

  const columnCountCallback = React.useCallback(() => {
    const columns = reCalculateColumnCount(breakpointCols);

    if (columnCount !== columns) {
      setColumnCount(columns);
    }
  }, [breakpointCols, columnCount]);

  React.useLayoutEffect(() => {
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
  return (
    <div {...rest} className={classNameOutput}>
      {renderColumns(
        children,
        columnCount,
        column,
        columnAttrs,
        columnClassName,
        itemHeightProp
      )}
    </div>
  );
};

export default Masonry;
