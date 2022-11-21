class SingleRecordTableWidget extends HTMLTableElement {
  constructor( record, locale) {
    super();
    const decimalPlaces = 2,
          loc = locale || "en-US",
          numFmt = new Intl.NumberFormat( loc, {maximumFractionDigits: decimalPlaces});
    this.record = record;
    // bind the syncRecordField event handler to this widget object
    this.syncRecordField = this.syncRecordField.bind( this);
    // build and insert table rows
    for (const fieldName of Object.keys( record)) {
      const value = record[fieldName],
            rowEl = this.insertRow();
      let displayString="";
      rowEl.insertCell().textContent = fieldName;
      const secColCellEl = rowEl.insertCell();
      secColCellEl.contentEditable = "true";
      if (typeof value === "string") {
        secColCellEl.setAttribute("data-type","String");
        displayString = value;
      } else if (Number.isInteger(value)) {
        secColCellEl.inputmode = "numeric";
        secColCellEl.setAttribute("data-type","Integer");
        displayString = String( value);
        secColCellEl.title = numFmt.format( value);
      } else if (typeof value === "number") {
        secColCellEl.inputmode = "decimal";
        secColCellEl.setAttribute("data-type","Decimal");
        displayString = String( value);
        secColCellEl.title = numFmt.format( value);
      } else if (Array.isArray( value)) {
        secColCellEl.setAttribute("data-type","List");
        displayString = JSON.stringify( value);
      } else if (typeof value === "object" && Object.keys( value).length > 0) {
        secColCellEl.setAttribute("data-type","Record");
        displayString = JSON.stringify( value);
      }
      secColCellEl.textContent = displayString;
      secColCellEl.addEventListener("input", this.syncRecordField);
    }
  }
  // input event handler
  syncRecordField(e) {
    const secondColCell = e.target,
          string = secondColCell.textContent,
          dataType = secondColCell.getAttribute("data-type"),
          fieldName = secondColCell.parentElement.firstElementChild.textContent;
    function parseValueString( valStr, type) {
      if (type === "String") return valStr;
      else switch (type) {
        case "Integer":
          if (String(parseInt(valStr)) === valStr) return parseInt(valStr);
          else return undefined;
        case "Decimal":
          if (String(parseFloat(valStr)) === valStr) return parseFloat(valStr);
          else return undefined;
        case "List":
        case "Record":
          let val;
          try {
            val = JSON.parse(valStr);
          } catch (error) {
            val = undefined;
          }
          return val;
      }
    }

    let value = parseValueString( string, dataType);
    if (value) {
      this.record[fieldName] = value;
      secondColCell.classList.remove("invalid");
    } else {
      secondColCell.classList.add("invalid");
    }
  }
  // use for initializing element (e.g., for setting up event listeners)
  connectedCallback() {
  }
  disconnectedCallback() {
    // remove event listeners for cleaning up
    for (const row of this.rows) {
      const secondColCell = row.children[1];
      secondColCell.removeEventListener("input", this.syncRecordField);
    }
  }
}
customElements.define('single-record-table-widget', SingleRecordTableWidget, {extends:"table"});
/**
 * Renders an entity table (a map of entity records with entity IDs as keys) as an
 * HTML table and allows editing the values of certain fields in the corresponding
 * table column, such that changes in a cell are propagated back to the corresponding
 * record field within the collection of entity records, keeping the entityRecords
 * property in sync with the table.
 * @class
 * @param {Object} entityRecordsOrClass - a map of entity records with entity IDs as keys
 *                                        or a class with attributeDeclarations and instances
 * @param {{columnDeclarations: Object, editableColumns: Object,
 *     locale: string}} options record
 */
class EntityTableWidget extends HTMLTableElement {
  constructor( entityRecordsOrClass, {columnDeclarations,editableColumns,locale}={}) {
    super();
    let entityIDs=[], entityRecords=null, firstEntityRecord=null, EntityType=null;
    if (EntityTableWidget.isClass( entityRecordsOrClass)) {  // a class
      if (!("instances" in entityRecordsOrClass) || Object.keys( entityRecordsOrClass.instances).length===0) {
        throw `No instances defined for class ${entityRecordsOrClass.name}`;
      }
      EntityType = entityRecordsOrClass;
      if ("attributeDeclarations" in EntityType) {
        columnDeclarations = EntityType.attributeDeclarations;
      }
      if ("displayAttributes" in EntityType) {
        this.displayAttributes = EntityType.displayAttributes;
      }
      entityRecords = EntityType.instances;
      entityIDs = Object.keys( entityRecords);
      firstEntityRecord = entityRecords[entityIDs[0]];
    } else {  // a map of entity records
      if (typeof entityRecordsOrClass !== "object" || Object.keys( entityRecordsOrClass).length===0) {
        throw "EntityTableWidget argument is not a map of entity records!"
      }
      entityRecords = entityRecordsOrClass;
      entityIDs = Object.keys( entityRecords);
      firstEntityRecord = entityRecords[entityIDs[0]];
      EntityType = firstEntityRecord.constructor;
    }
    if (!editableColumns && EntityType.editableAttributes) {
      editableColumns = EntityType.editableAttributes;
    }
    const constrViolations = dt.checkEntityTable( entityRecords, columnDeclarations);
    if (constrViolations.length > 0) {
      console.log(`Errors in entity table ${EntityType.name}:`);
      for (const constrVio of constrViolations) {
        console.log(`${constrVio.constructor.name}: ${constrVio.message}`);
      }
      return;
    }
    const idAttribute = Object.keys( firstEntityRecord)[0],
          decimalPlaces = 2,
          loc = locale || "en-US",
          numFmt = new Intl.NumberFormat( loc, {maximumFractionDigits: decimalPlaces});
    const tBodyEl = this.createTBody(),
          headerRowEl = this.createTHead().insertRow();
    // bind the "this" variable of UI event handlers to this widget object
    // and store a reference to the resulting function in a corresponding attribute
    this.syncRecordField = this.syncRecordField.bind( this);
    this.addEntityTableRow = this.addEntityTableRow.bind( this);
    this.addEntityRecord = this.addEntityRecord.bind( this);
    this.deleteEntityRecord = this.deleteEntityRecord.bind( this);
    // define event listeners at the table level
    this.addEventListener("input", this.syncRecordField);
    // create caption for a typed entity records table
    if (EntityType.name !== "Object") {
      this.entityType = EntityType;
      this.createCaption().textContent = EntityType.name;
    }
    this.className = "EntityTableWidget";
    this.entityRecords = entityRecords;
    // create list of attribute names
    if (columnDeclarations) {
      this.columnDeclarations = columnDeclarations;
      this.attributeNames = Object.keys( columnDeclarations);
    } else {  // create list of attribute names from first entity record
      this.attributeNames = Object.keys( firstEntityRecord);
    }
    if (!this.displayAttributes) this.displayAttributes = this.attributeNames;
    // create list of attribute ranges
    this.attributeRanges = {};
    for (const attr of this.attributeNames) {
      this.attributeRanges[attr] = columnDeclarations ?
          this.columnDeclarations[attr].range : dt.determineDatatype( firstEntityRecord[attr]);
    }
    // create column headings
    for (const attr of this.displayAttributes) {
      const thEl = document.createElement("th");
      thEl.textContent = columnDeclarations ? this.columnDeclarations[attr].label : attr;
      thEl.scope = "col";
      headerRowEl.appendChild( thEl);
    }
    // create an additional column/cell for the AddRow button
    const addRowButtonCellEl = headerRowEl.insertCell();
    addRowButtonCellEl.innerHTML = "<button class='AddRow' type='button' title='Add row'>+</button>";
    addRowButtonCellEl.firstElementChild.addEventListener("click", this.addEntityTableRow);
    // create and insert table rows
    for (const id of entityIDs) {
      const record = entityRecords[id],
            rowEl = tBodyEl.insertRow();
      for (const attrName of this.displayAttributes) {
        const value = record[attrName],
              datatype = this.attributeRanges[attrName],
              cellEl = rowEl.insertCell();
        // set UI features
        if (dt.isIntegerType( datatype)) {
          cellEl.inputmode = "numeric";
          cellEl.title = numFmt.format( value);
        } else if (dt.isDecimalType( datatype)) {
          cellEl.inputmode = "decimal";
          cellEl.title = numFmt.format( value);
        }
        cellEl.textContent = dt.stringifyValue( value, datatype);
        if (attrName !== idAttribute) {  // not for the ID attribute
          if (!editableColumns || editableColumns.includes( attrName)) {
            cellEl.contentEditable = "true";
            //cellEl.addEventListener("input", this.syncRecordField);
          }
        }
      }
      // create an additional cell for the Delete button
      const deleteBtnCellEl = rowEl.insertCell();
      deleteBtnCellEl.innerHTML = "<button class='Delete' type='button' title='Delete row'>x</button>";
      deleteBtnCellEl.firstElementChild.addEventListener("click", this.deleteEntityRecord);
    }
  }
  /*************************************************
   **** UI event handlers *****************************
   *************************************************/
  // input event handler for propagating changes in a table cell to the underlying record field
  syncRecordField(e) {
    if (e.target.tagName !== "TD") return;
    const cellEl = e.target,
          valueString = cellEl.textContent,
          fieldName = this.attributeNames[cellEl.cellIndex],
          dataType = this.attributeRanges[fieldName],
          entityId = cellEl.parentElement.firstElementChild.textContent;
    // check range constraint and convert string to value
    let value = dt.parseValueString( valueString, dataType);
    if (value === undefined) {
      const phrase = dt.dataTypes[dataType]?.phrase || `of type ${dataType}`;
      cellEl.classList.add("invalid");
      // create error message only, if value string is nonempty and last character is not a comma
      if (valueString !== "" && valueString.substr( valueString.length-1) !== ",") {
        console.log(`RangeConstraintViolation: the value ${valueString} is not ${phrase}!`);
      }
    } else if (this.columnDeclarations && fieldName in this.columnDeclarations) {
      // check other constraints
      const constrVio = dt.check( fieldName, this.columnDeclarations[fieldName], value);
      if (constrVio.length === 1 && constrVio[0] instanceof NoConstraintViolation) {
        // do not sync table cell if not yet added
        if (cellEl.parentElement.className !== "toBeAdded") {
          this.entityRecords[entityId][fieldName] = value;
        }
        cellEl.classList.remove("invalid");
      } else {
        for (const cV of constrVio) {
          console.log(`${cV.constructor.name}: ${cV.message}`);
        }
      }
    } else {
      // do not sync table cell if not yet added
      if (cellEl.parentElement.className !== "toBeAdded") {
        this.entityRecords[entityId][fieldName] = value;
      }
      cellEl.classList.remove("invalid");
    }
  }
  // click event handler for adding a table row
  addEntityTableRow(e) {
    //if (e.target.tagName !== "BUTTON" || e.target.className !== "AddRow") return;
    const rowEl = this.insertRow();
    rowEl.className = "toBeAdded";
    for (const attr of this.attributeNames) {
      const datatype = this.attributeRanges[attr],
            cellEl = rowEl.insertCell();
      // set UI features
      if (dt.isIntegerType( datatype)) {
        cellEl.inputmode = "numeric";
      } else if (dt.isDecimalType( datatype)) {
        cellEl.inputmode = "decimal";
      }
      cellEl.contentEditable = "true";
    }
    // create an additional cell for the AddRecord button
    const addRecordBtnCellEl = rowEl.insertCell();
    addRecordBtnCellEl.innerHTML = "<button class='AddRecord' type='button' title='Save record'>+</button>";
    addRecordBtnCellEl.firstElementChild.addEventListener("click", this.addEntityRecord);
  }
  // click event handler for adding a record
  addEntityRecord(e) {
    if (e.target.tagName !== "BUTTON" || e.target.className !== "AddRecord") return;
    const btnEl = e.target,
          rowEl = btnEl.parentElement.parentElement,
          entityId = rowEl.cells[0].textContent,
          record = {};
    let recordIsValid = true;
    for (let i=0; i < this.attributeNames.length; i++) {
      const attr = this.attributeNames[i],
            valStr = rowEl.cells[i].textContent,
            val = dt.parseValueString( valStr, this.attributeRanges[attr]);
      if (val === undefined) {
        recordIsValid = false;
        rowEl.cells[i].classList.add("invalid");
      } else {
        // check other constraints
        const constrVio = dt.check( attr, this.columnDeclarations[attr], val);
        if (constrVio.length === 1 && constrVio[0] instanceof NoConstraintViolation) {
          record[this.attributeNames[i]] = val;
          rowEl.cells[i].classList.remove("invalid");
        } else {
          recordIsValid = false;
          rowEl.cells[i].classList.add("invalid");
          for (const cV of constrVio) {
            console.log(`${cV.constructor.name}: ${cV.message}`);
          }
        }
      }
    }
    if (recordIsValid) {
      // add record to entityRecords
      this.entityRecords[entityId] = this.entityType ? new this.entityType( record) : record;
      console.log(`Record with ID = ${entityId} added.`);
      rowEl.cells[0].contentEditable = "false";  // protect entity ID cell
      rowEl.className = "";
      // convert AddRecord button to Delete button
      btnEl.removeEventListener("click", this.addEntityRecord);
      btnEl.className = "Delete";
      btnEl.title = "Delete record";
      btnEl.textContent = "x";
      btnEl.addEventListener("click", this.deleteEntityRecord);
    }
  }
  // click event handler for deleting a row
  deleteEntityRecord(e) {
    if (e.target.tagName !== "BUTTON" || e.target.className !== "Delete") return;
    const btnEl = e.target,
        rowIndex = btnEl.parentElement.parentElement.rowIndex,
        entityId = Object.keys( this.entityRecords)[rowIndex-1];
    console.log(`Record with ID = ${entityId} deleted.`);
    delete this.entityRecords[entityId];
    this.deleteRow( rowIndex);  // DOM method
  }
  /*************************************************
   **** Life cycle event handlers ******************
   *************************************************/
  // use for initializing element (e.g., for setting up event listeners)
  connectedCallback() {
  }
  disconnectedCallback() {
    // remove event listeners for cleaning up
    // (1) remove event listeners at the table level
    this.removeEventListener("input", this.syncRecordField);
    // (2) remove event listener for AddRow button
    const firstRow = this.rows[0],
          lastCellOfFirstRowCells = firstRow.cells[firstRow.cells.length-1];
    lastCellOfFirstRowCells.removeEventListener("click", this.addEntityTableRow);
    // (3) remove event listeners for Delete buttons
    for (let i=1; i < this.rows.length; i++) {
      const row = this.rows[i],
            lastCell = row.cells[row.cells.length-1];
      lastCell.removeEventListener("click", this.deleteEntityRecord);
    }
  }
  static isClass(C) {  // https://stackoverflow.com/questions/526559/testing-if-something-is-a-class-in-javascript
    return typeof C === "function" && C.prototype !== undefined;
  }
}
customElements.define('entity-table-widget', EntityTableWidget, {extends:"table"});
/**
* SVG library
* @author Gerd Wagner
*/
var svg = {
  NS: "http://www.w3.org/2000/svg",  // namespace
  XLINK_NS: "http://www.w3.org/1999/xlink",
  /**
  * Create an SVG element
  * 
  * @param {object} params  a lsit of optional parameters
  * @return {node} svgElement
  */
  createSVG: function (params) {
    const el = document.createElementNS( svg.NS,"svg");
    el.setAttribute("version", "1.1");
    el.setAttribute("width", params.width || "100%");
    el.setAttribute("height", params.height || "100%");
    if (params.id) el.id = params.id;
    if (params.class) el.className = params.class;
    if (params.viewBox) el.setAttribute("viewBox", params.viewBox);
    return el;
  },
  createDefs: function () {
    return document.createElementNS( svg.NS,"defs");
  },
  setOptionalAttr: function (el, optParams) {
    if (optParams === undefined) optParams = {};
    if (optParams.id) el.id = optParams.id;
    if (optParams.class) el.className = optParams.class;
    el.setAttribute("stroke", optParams.stroke || "black");
    el.setAttribute("stroke-width", optParams.strokeWidth || "1");
    el.setAttribute("fill", optParams.fill || "white");
  },
  createRect: function (x, y, width, height, optParams) {
    const el = document.createElementNS( svg.NS,"rect");
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    el.setAttribute("width", width);
    el.setAttribute("height", height);
    svg.setOptionalAttr( el, optParams);
    return el;
  },
  createCircle: function ( cx, cy, r, optParams) {
    const el = document.createElementNS( svg.NS,"circle");
    el.setAttribute("cx", cx);
    el.setAttribute("cy", cy);
    el.setAttribute("r", r);
    svg.setOptionalAttr( el, optParams);
    return el;
  },
  createLine: function (x1, y1, x2, y2, optParams) {
    const el = document.createElementNS( svg.NS,"line");
    el.setAttribute("x1", x1);
    el.setAttribute("y1", y1);
    el.setAttribute("x2", x2);
    el.setAttribute("y2", y2);
    svg.setOptionalAttr( el, optParams);
    return el;
  },
  createPath: function (d, optParams) {
    const el = document.createElementNS( svg.NS,"path");
    el.setAttribute("d", d);
    svg.setOptionalAttr( el, optParams);
    return el;
  },
  createGroup: function (optParams) {
    const el = document.createElementNS( svg.NS,"g");
    svg.setOptionalAttr( el, optParams);
    return el;
  },
  createText: function ( x, y, txt, style) {
    const el = document.createElementNS( svg.NS,"text");
    el.textContent = txt;
    el.setAttribute("x", x);
    el.setAttribute("y", y);
    if (style) el.style = style;  // el.setAttribute("style", style);
    return el;
  },
  createShape: function (shape, shapeAttributes, style, obj) {
    const el = document.createElementNS( svg.NS, shape);
    Object.keys( shapeAttributes).forEach( function (attrName) {
      var val;
      if (typeof shapeAttributes[attrName] === "function") {
        val = shapeAttributes[attrName](obj);
      } else val = shapeAttributes[attrName];
      el.setAttribute( attrName, val);
    })
    if (style) el.setAttribute("style", style);
    return el;
  },
  createShapeFromDefRec: function (shDefRec, obj) {
    var el = document.createElementNS( svg.NS, shDefRec.shapeName),
        shAttribs = shDefRec.shapeAttributes;
    Object.keys( shAttribs).forEach( function (attrName) {
      var val;
      if (typeof shAttribs[attrName] === "function") {
        val = shAttribs[attrName]( obj);
      } else val = shAttribs[attrName];
      switch (attrName) {
      case "textContent":
        el.textContent = val;
        break;
      case "file":
        el.setAttributeNS( svg.XLINK_NS, "href", val);
        break;
      default:
        el.setAttribute( attrName, val);
        break;
      }
    })
    if (shDefRec.style) el.setAttribute("style", shDefRec.style);
    return el;
  },
  createImageFillPattern: function (id, file, optParams) {
    var patEl = document.createElementNS( svg.NS,"pattern"),
        imgEl = document.createElementNS( svg.NS,"image");
    if (!optParams) optParams = {};
    imgEl.setAttributeNS( svg.XLINK_NS, "href", file);
    imgEl.setAttribute("width", optParams.width || 20);
    imgEl.setAttribute("height", optParams.height || 20);
    patEl.appendChild( imgEl);
    patEl.id = id;
    patEl.setAttribute("patternUnits", "userSpaceOnUse");
    patEl.setAttribute("width", optParams.width || 20);
    patEl.setAttribute("height", optParams.height || 20);
    if (optParams.x) patEl.setAttribute("x", optParams.x);
    if (optParams.y) patEl.setAttribute("y", optParams.y);
    return patEl;
  }
};


const util = {
  /*******************************************************************************
   * Create option elements from an array list of option text strings
   * and insert them into a selection list element
   * @param {object} selEl  A select(ion list) element
   * @param {Array<string>} strings  An array list of strings
   ******************************************************************************/
  fillSelectWithOptionsFromStringList( selEl, strings) {
    for (let i=0; i < strings.length; i++) {
      let el = document.createElement("option");
      el.textContent = `(${i}) ${strings[i]}`;
      el.value = i;
      selEl.add( el, null);
    }
  },
  // the progress indication is indeterminate if there is no value
  createProgressBarEl( title, value) {
    const progressContainerEl = document.createElement("div"),
        progressEl = document.createElement("progress"),
        progressLabelEl = document.createElement("label"),
        progressInfoEl = document.createElement("p");
    progressEl.id = "progress";
    // values between 0 and 1
    if (value !== undefined) progressEl.value = value;  // initial value
    progressLabelEl.for = "progress";
    progressLabelEl.textContent = title;
    progressContainerEl.id = "progress-container";
    progressContainerEl.appendChild( progressLabelEl);
    progressContainerEl.appendChild( progressEl);
    progressContainerEl.appendChild( progressInfoEl);
    return progressContainerEl
  },
  createExpandablePanel({id, heading, hint, borderColor}) {
    const uiPanelEl = document.createElement("details"),
          headEl = document.createElement("summary");
    uiPanelEl.id = id;
    uiPanelEl.className = "expandablePanel";
    if (borderColor) uiPanelEl.style.borderColor = borderColor;
    headEl.innerHTML = heading;
    if (hint) headEl.title = hint;
    uiPanelEl.appendChild( headEl);
    uiPanelEl.style.overflowX = "auto";  // horizontal scrolling
    return uiPanelEl;
  },
  /*******************************************************************************
   * Generate a file from text
   * @param {string} filename - Name of the file
   * @param {string} text - Content of the file
   ******************************************************************************/
  generateTextFile( filename, text) {
    var data, aElem, url;
    data = new Blob( [text], {type: "text/plain"});
    url = window.URL.createObjectURL(data);
    aElem = document.createElement("a");
    aElem.setAttribute( "style", "display: none");
    aElem.setAttribute( "href", url);
    aElem.setAttribute( "download", filename);
    document.body.appendChild( aElem);
    aElem.click();
    window.URL.revokeObjectURL( url);
    aElem.remove();
  },
  // from https://stackoverflow.com/questions/5646279/get-object-class-from-string-name-in-javascript/53199720
  getClass( name){
    var Class=null;
    if (name.match(/^[a-zA-Z0-9_]+$/)) {
      // proceed only if the name is a single word string
      Class = eval( name);
    } else {  // not a name
      throw new Error("getClass requires a single word string as argument!");
    }
    return Class;
    // Alternative solution: Class = this[name];
  },
  getSuperClassOf( C) {
    return Object.getPrototypeOf( C);
  },
  loadScript( fileURL) {
    return new Promise( function (resolve, reject) {
      const scriptEl = document.createElement("script");
      scriptEl.src = fileURL;
      scriptEl.onload = resolve;
      scriptEl.onerror = function () {
        reject( new Error(`Script load error for ${fileURL}`));
      };
      document.head.append( scriptEl);
      console.log(`${fileURL} loaded.`);
    });
  },
  loadCSS( fileURL) {
    return new Promise( function (resolve, reject) {
      const linkEl = document.createElement("link");
      linkEl.href = fileURL;
      linkEl.rel = "stylesheet";
      linkEl.type = "text/css";
      linkEl.onload = resolve;
      linkEl.onerror = function () {
        reject( new Error(`CSS load error for ${fileURL}`));
      };
      document.head.append( linkEl);
      console.log(`${fileURL} loaded.`);
    });
  }
}
const dt = {
  classes: {},
  // define lists of datatype names
  stringTypes: ["String","NonEmptyString","Identifier","Email","URL","PhoneNumber"],
  integerTypes: ["Integer","PositiveInteger","NonNegativeInteger","AutoIdNumber","Year"],
  decimalTypes: ["Number","Decimal","Percent","ClosedUnitInterval","OpenUnitInterval"],
  otherPrimitiveTypes: ["Boolean","Date","DateTime"],
  structuredDataTypes: ["List","Record"],
  isStringType(T) {return dt.stringTypes.includes(T);},
  isIntegerType(T) {return dt.integerTypes.includes(T) ||
      typeof eNUMERATION === "object" && T instanceof eNUMERATION;},
  isDecimalType(T) {return dt.decimalTypes.includes(T);},
  isNumberType(T) {return dt.numericTypes.includes(T);},
  patterns: {
    ID: /^([a-zA-Z0-9][a-zA-Z0-9_\-]+[a-zA-Z0-9])$/,
    // defined in WHATWG HTML5 specification
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    // proposed by Diego Perini (https://gist.github.com/729294)
    URL: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i,
    INT_PHONE_NO: /^\+(?:[0-9] ?){6,14}[0-9]$/
  },
  isIntegerString(x) {
    return typeof(x) === "string" && x.search(/^-?[0-9]+$/) === 0;
  },
  isDateString(v) {
    return typeof v === "string" &&
        /\d{4}-(0\d|1[0-2])-([0-2]\d|3[0-1])/.test(v) && !isNaN(Date.parse(v));
  },
  isDateTimeString(v) {
    return typeof(x) === "string" && x.search(/^-?[0-9]+$/) === 0;
  },
  /**
   * Determines the implicit datatype of a value.
   * @param {*} value
   * @return {string}
   */
  determineDatatype( value) {
    var dataType="";
    if (typeof value === "string") {
      dataType = "String";
    } else if (Number.isInteger(value)) {
      if (1800<=value && value<2100) dataType = "Year";
      else dataType = "Integer";
    } else if (typeof value === "number") {
      dataType = "Decimal";
    } else if (Array.isArray( value)) {
      dataType = "List";
    } else if (typeof value === "object" && Object.keys( value).length > 0) {
      dataType = "Record";
    }
    return dataType;
  },
  /**
   * Converts a string to a value according to a prescribed datatype.
   * The return value is undefined, if the string does not comply with the datatype.
   * @param {string} valStr - the string to be converted
   * @param {string} type - one of: Integer, Year, Decimal, List, Record, ...
   * @return {*}
   */
  parseValueString( valStr, type) {
    var value=[], valueStringsToParse=[];
    if (valStr.includes(",")) {  // a collection value
      valueStringsToParse = valStr.split(",");
    } else {
      valueStringsToParse = [valStr];
    }
    if (dt.isStringType( type)) {
      for (const str of valueStringsToParse) {
        if (!dt.dataTypes[type].condition( str)) {
          value = undefined; break;
        } else {
          value.push( str);
        }
      }
    } else if (dt.isIntegerType( type)) {
      for (const str of valueStringsToParse) {
        if (isNaN( parseInt( str)) || !dt.dataTypes[type].stringCondition( str)) {
          value = undefined; break;
        } else {
          value.push( parseInt( str));
        }
      }
    } else if (dt.isDecimalType( type)) {
      for (const str of valueStringsToParse) {
        if (isNaN( parseFloat( str)) || !dt.dataTypes[type].stringCondition( str)) {
          value = undefined; break;
        } else {
          value.push( parseFloat( str));
        }
      }
    } else {
      switch (type) {
      case "Date":
      case "DateTime":
        for (const str of valueStringsToParse) {
          if (isNaN( Date.parse( str))) {
            value = undefined; break;
          } else {
            value.push( Date.parse( str));
          }
        }
        break;
      case "Boolean":
        for (const str of valueStringsToParse) {
          if (!["true","yes","false","no"].includes( str)) {
            value = undefined; break;
          } else {
            value.push(["true","yes"].includes( str));
          }
        }
        break;
      case "List":
      case "Record":
        for (const str of valueStringsToParse) {
          let val;
          try {
            val = JSON.parse( str);
          } catch (error) {
            val = undefined; break;
          }
          if (val) value.push( val);
        }
        break;
      default:
        if (type in dt.classes) {
          for (const str of valueStringsToParse) {  // should be an ID
            const obj = dt.classes[type].instances[str];
            if (!obj) {
              value = undefined; break;
            } else {
              value.push( obj.id);  // convert to object IDs
            }
          }
        } else if (type in dt.dataTypes && "str2val" in dt.dataTypes[type] &&
            dt.isOfType( value, type)) {
          value = dt.dataTypes[type].str2val( valStr);
        } else {
          value = undefined;
        }
      }
    }
    if (value && value.length === 1) {  // single value
      value = value[0];
    }
    return value;
  },
  /**
   * Converts a value to a string according to an explicitly provided (or implicit) datatype.
   * The return value is undefined, if the string does not comply with the datatype.
   * @param {string} value - the value to be stringified
   * @param {string} type - one of: Integer, Year, Decimal, List, Record
   * @return {string}
   */
  stringifyValue( value, type) {
    let string="", valuesToStringify=[];
    if (!type) type = dt.determineDatatype( value);
    // make sure value is an array
    if (!Array.isArray( value)) {
      if (type in dt.classes && typeof value === "object" &&
          Object.keys(value).every( id => value[id] instanceof dt.classes[type])) {
        // value is an entity table (a map from IDs to objects of a certain type)
        valuesToStringify = Object.keys( value);
      } else {
        valuesToStringify = [value];
      }
    } else {
      valuesToStringify = value;
    }
    if (dt.isStringType( type)) {
      string = valuesToStringify.toString();
    } else if (dt.isNumberType( type)) {
      string = valuesToStringify.toString();
    } else if (type in dt.classes) {
      string = valuesToStringify.toString();
    } else {
      switch (type) {
        case "List":
        case "Record":
          string = JSON.stringify( value);
          break;
        default:
          if (type in dt.dataTypes && "val2str" in dt.dataTypes[type] &&
              dt.isOfType( value, type)) {
            string = dt.dataTypes[type].val2str( value);
          }
      }
    }
    return string;
  },
  // from https://stackoverflow.com/questions/5646279/get-object-class-from-string-name-in-javascript/53199720
  getClassByName( name){
    var Class=null;
    if (name.match(/^[a-zA-Z0-9_]+$/)) {
      // proceed only if the name is a single word string
      Class = eval( name);
    } else {  // not a name
      throw new Error("getClass requires a single word string as argument!");
    }
    return Class;
    // Alternative solution: Class = this[name];
  },
  /********************************************************************
   Assuming that in the case of a simple entity table, the first entity record
   defines the attributes/structure of the table, check if all records include
   these attributes. Otherwise, for an entity table with attribute declarations,
   check if all records satisfy the declarations.
   ********************************************************************/
  checkEntityTable( entityRecords, columnDeclarations) {
    if (!(entityRecords instanceof Object) || Object.keys( entityRecords).length === 0) return false;
    const entityIDs = Object.keys( entityRecords);
    let attributeNames=[], constrVio=[];
    if (columnDeclarations) {
      attributeNames = Object.keys( columnDeclarations);
    } else {
      const firstEntityRecord = entityRecords[entityIDs[0]];
      attributeNames = Object.keys( firstEntityRecord);
    }
    for (const id of entityIDs) {
      const record = entityRecords[id],
      recFields = Object.keys( record);
      for (const attr of attributeNames) {
        if (!recFields.includes( attr)) {
          constrVio.push( new Error(`The attribute ${attr} is missing in record with ID ${id}.`));
          return constrVio;
        }
        if (columnDeclarations) {
          const val = record[attr],
                range = columnDeclarations[attr].range;
          if (!range) {
            constrVio.push( new Error(`The attribute declaration of ${attr} does not declare the range of the attribute!`));
          } else if (!dt.supportedDatatypes.includes( range)  && !(range in dt.classes)) {
            constrVio.push( new Error(`The range ${range} is not a supported datatype or class! ${JSON.stringify(dt.classes)}`));
          }
          constrVio.push( ...dt.check( attr, columnDeclarations[attr], val));
          if (constrVio[constrVio.length-1] instanceof NoConstraintViolation) {
            constrVio.length -= 1;  // drop
          }
        }
      }
    }
    return constrVio;
  },
  registerModelClasses( listOfClassNames) {  // Make classes accessible via their name
    for (const className of listOfClassNames) {
      dt.classes[className] = dt.getClassByName( className);
    }
  },
  dataTypes: {
    "String": {phrase:"a string",
        condition: value => typeof value === "string"},
    "NonEmptyString": {phrase:"a non-empty string",
        condition: value => typeof value === "string" && value.trim() !== ""},
    "Email": {phrase:"an email address",
        condition: v => typeof v === "string" && v.trim() !== "" && dt.patterns.EMAIL.test( v)},
    "URL": {phrase:"a URL",
        condition: v => typeof v === "string" && v.trim() !== "" && dt.patterns.URL.test( v)},
    "PhoneNumber": {phrase:"an international phone number",
        condition: v => typeof v === "string" && v.trim() !== "" && dt.patterns.INT_PHONE_NO.test( v)},
    "Identifier": {phrase:"an identifier",  // an alphanumeric/"-"/"_" string
        condition: v => typeof v === "string" && v.trim() !== "" && dt.patterns.ID.test( v)},
    "Integer": {phrase:"an integer",
        stringCondition: valStr => dt.isIntegerString( valStr),
        condition: value => Number.isInteger( value)},
    "NonNegativeInteger": {phrase:"a non-negative integer",
        stringCondition: valStr => dt.isIntegerString( valStr) && parseInt( valStr) >= 0,
        condition: value => Number.isInteger(value) && value >= 0},
    "PositiveInteger": {phrase:"a positive integer",
        stringCondition: valStr => dt.isIntegerString( valStr) && parseInt( valStr) > 0,
        condition: value => Number.isInteger(value) && value > 0},
    "AutoIdNumber": {phrase:"a positive integer as required for an auto-ID",
        stringCondition: valStr => dt.isIntegerString( valStr) && parseInt( valStr) > 0,
        condition: value => Number.isInteger(value) && value > 0},
    "Year": {phrase:"a year number (between 1000 and 9999)",
        stringCondition: valStr => dt.isIntegerString( valStr) &&
            parseInt( valStr) >= 1000 && parseInt( valStr) <= 9999,
        condition: value => Number.isInteger(value) && value >= 1000 && value <= 9999},
    "Number": {phrase:"a number",
        stringCondition: valStr => !isNaN( parseFloat( valStr)) &&
            String( parseFloat( valStr)) === valStr,
        condition: value => typeof value === "number"},
    "Decimal": {phrase:"a decimal number",
        stringCondition: valStr => String( parseFloat( valStr)) === valStr,
        condition: value => typeof value === "number"},
    "Percent": {phrase:"a percentage number",
        stringCondition: valStr => String( parseFloat( valStr)) === valStr,
        condition: value => typeof value === "number"},
    "Probability": {phrase:"a probability number in [0,1]",
        stringCondition: valStr => String( parseFloat( valStr)) === valStr &&
            parseFloat( valStr) <= 1,
        condition: value => typeof value === "number" && value>=0 && value<=1},
    "ClosedUnitInterval": {phrase:"a number in the closed unit interval [0,1]",
        condition: value => typeof value === "number" && value>=0 && value<=1},
    "OpenUnitInterval": {phrase:"a number in the open unit interval (0,1)",
        condition: value => typeof value === "number" && value>0 && value<1},
    "Date": {phrase:"an ISO date string (or a JS Date value)",
        condition: value => value instanceof Date,
        str2val: s => new Date(s)},
    "DateTime": {phrase:"an ISO date-time string (or a JS Date value)",
        condition: value => value instanceof Date,
        str2val: s => new Date(s)},
    "Boolean": {phrase:"a Boolean value (true/'yes' or false/'no')",
        condition: value => typeof value === "boolean",
        str2val: s => ["true","yes"].includes(s) ? true :
            (["false","no"].includes(s) ? false : undefined)}
  },
  isOfType( value, Type) {
    const cond = dt.dataTypes[Type]?.condition;
    return cond !== undefined && cond( value);
  },
  range2JsDataType( range) {
    var jsDataType="";
    switch (range) {
    case "String":
    case "NonEmptyString":
    case "Email":
    case "URL":
    case "PhoneNumber":
    case "Date":
      jsDataType = "string";
      break;
    case "Integer":
    case "NonNegativeInteger":
    case "PositiveInteger":
    case "Number":
    case "AutoIdNumber":
    case "Decimal":
    case "Percent":
    case "ClosedUnitInterval":
    case "OpenUnitInterval":
      jsDataType = "number";
      break;
    case "Boolean":
      jsDataType = "boolean";
      break;
    default:
      if (range instanceof eNUMERATION) {
        jsDataType = "number";
      } else if (typeof range === "string" && mODELcLASS[range]) {
        jsDataType = "string";  // for the standard ID (TODO: can also be "number")
      } else if (typeof range === "object") {  // a.g. Array or Object
        jsDataType = "object";
      }
    }
    return jsDataType;
  },
  /**
   * Generic method for checking the integrity constraints defined in attribute declarations.
   * The values to be checked are first parsed/deserialized if provided as strings.
   * Copied from the cOMPLEXtYPE class of oNTOjs
   *
   * min/max: numeric (or string length) minimum/maximum
   * optional: true if property is single-valued and optional (false by default)
   * range: String|NonEmptyString|Integer|...
   * pattern: a regular expression to be matched
   * minCard/maxCard: minimum/maximum cardinality of a multi-valued property
   *     By default, maxCard is 1, implying that the property is single-valued, in which
   *     case minCard is meaningless/ignored. maxCard may be Infinity.
   *
   * @method
   * @author Gerd Wagner
   * @param {string} attr  The attribute for which a value is to be checked.
   * @param {object} decl  The attribute's declaration.
   * @param val  The value to be checked.
   * @param optParams.checkRefInt  Check referential integrity
   * @return {object}  The constraint violation object.
   */
  check( attr, decl, val, optParams) {
    var constrVio=[], valuesToCheck=[],
        minCard = decl.minCard !== "undefined" ? decl.minCard : (decl.optional ? 0 : 1),  // by default, an attribute is mandatory
        maxCard = decl.maxCard || 1,  // by default, an attribute is single-valued
        min = typeof decl.min === "function" ? decl.min() : decl.min,
        max = typeof decl.max === "function" ? decl.max() : decl.max,
        range = decl.range,
        msg = decl.patternMessage || "",
        pattern = decl.pattern;
    // check Mandatory Value Constraint
    if (val === undefined || val === "") {
      if (decl.optional) constrVio.push( new NoConstraintViolation());
      else constrVio.push( new MandatoryValueConstraintViolation(
            `A value for ${attr} is required!`));
    }
    if (maxCard === 1) {  // single-valued attribute
      if (range === "List" && Array.isArray(val)) {
        valuesToCheck = [[...val]];
      } else if (range === "Record" && typeof val === "object") {
        valuesToCheck = [{...val}];
      } else {
        valuesToCheck = [val];
      }
    } else {  // multi-valued properties (can be array-valued or map-valued)
      if (Array.isArray( val) ) {
        if (range === "List" && val.every( el => Array.isArray(el))) {
          valuesToCheck = val.map( a => [...a]);
        } else if (range === "Record" && val.every( el => typeof el === "object")) {
          valuesToCheck = val.map( function (o) {return {...o};});
        } else if (typeof range === "string" && range in dt.classes &&
              val.every( el => String(el) in dt.classes[range].instances)) {
          valuesToCheck = val.map( id => dt.classes[range].instances[id]);
        } else {
          valuesToCheck = val;
        }
      } else if (typeof val === "object" && typeof range === "string" && range in dt.classes) {
        if (!decl.isOrdered) {  // convert map to array list
          valuesToCheck = Object.keys( val).map( id => val[id]);
        } else {
          constrVio.push( new RangeConstraintViolation(
            `The ordered-collection-valued attribute ${attr} must not have a map value like ${val}`));
        }
      } else {
        valuesToCheck = [val];
      }
    }
    /***************************************************************
     ***  Convert value strings to values  *************************
     ***************************************************************/
    if (dt.isIntegerType( range)) {  // convert integer strings to integers
      valuesToCheck.forEach( function (v,i) {
        if (typeof v === "string") valuesToCheck[i] = parseInt( v);
      });
    } else if (dt.isDecimalType( range)) {  // convert decimal strings to decimal numbers
      valuesToCheck.forEach( function (v,i) {
        if (typeof v === "string") valuesToCheck[i] = parseFloat( v);
      });
    } else {
      switch (range) {
      case "Boolean":  // convert 'yes'/'no' strings to Boolean true/false
        valuesToCheck.forEach( function (v,i) {
          if (typeof v === "string") {
            if (["true","yes"].includes(v)) valuesToCheck[i] = true;
            else if (["no","false"].includes(v)) valuesToCheck[i] = false;
          }
        });
        break;
      case "Date":  // convert ISO date string to JS Date value
        valuesToCheck.forEach(function (v, i) {
          if (dt.isDateString(v)) valuesToCheck[i] = new Date(v);
        });
        break;
      case "DateTime":  // convert ISO date-time string to JS Date value
        valuesToCheck.forEach(function (v, i) {
          if (typeof v === "string" && !isNaN(Date.parse(v))) valuesToCheck[i] = new Date(v);
        });
        break;
      }
    }
    /********************************************************************
     ***  Check range constraints  **************************************
     ********************************************************************/
    if (range in dt.dataTypes) {
      for (const v of valuesToCheck) {
        if (!dt.dataTypes[range].condition( v)) {
          constrVio.push( new RangeConstraintViolation(
              `The value ${v} of attribute ${attr} is not ${dt.dataTypes[range].phrase}!`));
        }
      }
    } else {
      if (typeof eNUMERATION === "object" &&
          (range instanceof eNUMERATION || typeof range === "string" && eNUMERATION[range])) {
        if (typeof range === "string") range = eNUMERATION[range];
        for (const v of valuesToCheck) {
          if (!Number.isInteger(v) || v < 1 || v > range.MAX) {
            constrVio.push( new RangeConstraintViolation("The value "+ v +
                " is not an admissible enumeration integer for "+ attr));
          }
        }
      } else if (Array.isArray( range)) {  // *** Ad-hoc enumeration ***
        for (const v of valuesToCheck) {
          if (range.indexOf(v) === -1) {
            constrVio.push( new RangeConstraintViolation("The "+ attr +" value "+ v +
                " is not in value list "+ range.toString()));
          }
        }
      } else if (typeof range === "string" && range in dt.classes) {
        const RangeClass = dt.classes[range];
        valuesToCheck.forEach( function (v, i) {
          var recFldNames=[], propDefs={};
          if (!RangeClass.isComplexDatatype && !(v instanceof RangeClass)) {
            if (typeof v === "object") {
              constrVio.push( new ReferentialIntegrityConstraintViolation(
                  `The object ${JSON.stringify(v)} referenced by attribute ${attr} is not from its range ${range}`));
            } else {
              // convert IdRef to object reference
              if (RangeClass.instances[v]) {
                valuesToCheck[i] = RangeClass.instances[String(v)];
              } else if (optParams?.checkRefInt) {
                constrVio.push( new ReferentialIntegrityConstraintViolation("The value " + v +
                    " of attribute '"+ attr +"' is not an ID of any " + range + " object!"));
              }
            }
          } else if (RangeClass.isComplexDatatype && typeof v === "object") {
            v = Object.assign({}, v);  // use a clone
            // v is a record that must comply with the complex datatype
            recFldNames = Object.keys(v);
            propDefs = RangeClass.properties;
            // test if all mandatory properties occur in v and if all fields of v are properties
            if (Object.keys( propDefs).every( function (p) {return !!propDefs[p].optional || p in v;}) &&
                recFldNames.every( function (fld) {return !!propDefs[fld];})) {
              recFldNames.forEach( function (p) {
                var validationResult = dt.check( p, propDefs[p], v[p]);
                if (validationResult instanceof NoConstraintViolation) {
                  v[p] = validationResult.checkedValue;
                } else {
                  throw validationResult;
                }
              })
            } else {
              constrVio.push( new RangeConstraintViolation("The value of " + attr +
                  " must be an instance of "+ range +" or a compatible record!"+
                  JSON.stringify(v) + " is not admissible!"));
            }
          }
        });
      } else if (typeof range === "string" && range.includes("|")) {
        valuesToCheck.forEach( function (v, i) {
          var rangeTypes=[];
          rangeTypes = range.split("|");
          if (typeof v === "object") {
            if (!rangeTypes.some( rc => v instanceof dt.classes[rc])) {
              constrVio.push( new ReferentialIntegrityConstraintViolation("The object " + JSON.stringify(v) +
                  " is not an instance of any class from " + range + "!"));
            } else {
              v = valuesToCheck[i] = v.id;  // convert to IdRef
            }
          } else if (Number.isInteger(v)) {
            if (optParams && optParams.checkRefInt) {
              if (!dt.classes[range].instances[String(v)]) {
                constrVio.push( new ReferentialIntegrityConstraintViolation(
                    `The value ${v} of attribute "${attr}" is not an ID of any ${range} object!`));
              }
            }
          } else if (typeof v === "string") {
            if (!isNaN( parseInt(v))) v = valuesToCheck[i] = parseInt(v);
          } else {
            constrVio.push( new RangeConstraintViolation(
                `The value (${v}) of attribute "${attr}" is neither an integer nor a string!`));
          }
        });
      } else if (typeof range === "object" && range.dataType !== undefined) {
        // the range is a (collection) datatype declaration record
        for (const v of valuesToCheck) {
          if (typeof v !== "object") {
            constrVio.push( new RangeConstraintViolation("The value of " + attr +
                " must be an object! " + JSON.stringify(v) + " is not admissible!"));
          }
          switch (range.dataType) {
            case "Array":
              if (!Array.isArray(v)) {
                constrVio.push( new RangeConstraintViolation("The value of " + attr +
                    " must be an array! " + JSON.stringify(v) + " is not admissible!"));
                break;
              }
              if (v.length !== range.size) {
                constrVio.push( new RangeConstraintViolation("The value of " + attr +
                    " must be an array of length " + range.size + "! " + JSON.stringify(v) + " is not admissible!"));
                break;
              }
              for (let i = 0; i < v.length; i++) {
                if (!dt.isOfType(v[i], range.itemType)) {
                  constrVio.push( new RangeConstraintViolation("The items of " + attr +
                      " must be of type " + range.itemType + "! " + JSON.stringify(v) +
                      " is not admissible!"));
                }
              }
              break;
            case "ArrayList":
              if (!Array.isArray(v)) {
                constrVio.push( new RangeConstraintViolation("The value of " + attr +
                    " must be an array! " + JSON.stringify(v) + " is not admissible!"));
                break;
              }
              for (let i = 0; i < v.length; i++) {
                if (!dt.isOfType(v[i], range.itemType)) {
                  constrVio.push( new RangeConstraintViolation("The items of " + attr +
                      " must be of type " + range.itemType + "! " + JSON.stringify(v) +
                      " is not admissible!"));
                }
              }
              break;
          }
        }
      } else if (range === Object) {
        for (const v of valuesToCheck) {
          if (!(v instanceof Object)) {
            constrVio.push( new RangeConstraintViolation("The value of " + attr +
                " must be a JS object! " + JSON.stringify(v) + " is not admissible!"));
          }
        }
      }
    }
    // return constraint violations found in range constraint checks
    if (constrVio.length > 0) return constrVio;

    /********************************************************
     ***  Check constraints that apply to several ranges  ***
     ********************************************************/
    if (range === "String" || range === "NonEmptyString") {
      for (const v of valuesToCheck) {
        if (min !== undefined && v.length < min) {
          constrVio.push( new StringLengthConstraintViolation("The length of "+
              attr + " must not be smaller than "+ min));
        } else if (max !== undefined && v.length > max) {
          constrVio.push( new StringLengthConstraintViolation("The length of "+
              attr + " must not be greater than "+ max));
        } else if (pattern !== undefined && !pattern.test( v)) {
          constrVio.push( new PatternConstraintViolation( msg || v +
              "does not comply with the pattern defined for "+ attr));
        }
      }
    }
    // check Interval Constraints
    if (dt.isNumberType( range)) {
      for (const v of valuesToCheck) {
        if (min !== undefined && v < min) {
          constrVio.push( new IntervalConstraintViolation( attr +
              " must be greater than "+ min));
        } else if (max !== undefined && v > max) {
          constrVio.push( new IntervalConstraintViolation( attr +
              " must be smaller than "+ max));
        }
      }
    }
    // return constraint violations found in range constraint checks
    if (constrVio.length > 0) return constrVio;

    /********************************************************
     ***  Check cardinality constraints  *********************
     ********************************************************/
    if (maxCard > 1) { // (a multi-valued attribute can be array- or map-valued)
      // check minimum cardinality constraint
      if (minCard > 0 && valuesToCheck.length < minCard) {
        constrVio.push( new CardinalityConstraintViolation(
            `A collection of at least ${minCard} values is required for ${attr}`));
      }
      // check maximum cardinality constraint
      if (valuesToCheck.length > maxCard) {
        constrVio.push( new CardinalityConstraintViolation("A collection value for "+
            attr +" must not have more than "+ maxCard +" members!"));
      }
    }
    if (constrVio.length === 0) {
      // return de-serialized value available in validationResult.checkedValue
      constrVio.push( new NoConstraintViolation( maxCard === 1 ? valuesToCheck[0] : valuesToCheck));
    }
    return constrVio;
  }
}
dt.numericTypes = dt.integerTypes.concat( dt.decimalTypes);
dt.primitiveDatatypes = [...dt.stringTypes, ...dt.numericTypes, ...dt.otherPrimitiveTypes];
dt.supportedDatatypes = [...dt.primitiveDatatypes, ...dt.structuredDataTypes];

/**
 * @fileOverview  Defines error classes (also called "exception" classes)
 * for property constraint violations
 * @author Gerd Wagner
 */
class ConstraintViolation extends Error {
  constructor (msg) {
    super( msg);
  }
}
class NoConstraintViolation extends ConstraintViolation {
  constructor ( val) {
    super("okay");
    if (val !== undefined) this.checkedValue = val;
  }
}
class MandatoryValueConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class RangeConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class StringLengthConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class IntervalConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class PatternConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class CardinalityConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class UniquenessConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class ReferentialIntegrityConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}
class FrozenValueConstraintViolation extends ConstraintViolation {
  constructor (msg) {
    super( msg);
  }
}

/*******************************************************************************
 * Math/Statistics Library for OESCore
 *
 * @copyright Copyright 2020 Gerd Wagner
 *   Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license The MIT License (MIT)
 * @author Gerd Wagner
 ******************************************************************************/

/****************************************************************
 ****************************************************************/
const math = {};
/**
 * Compute the Cartesian Product of an array of arrays
 * From https://stackoverflow.com/a/36234242/2795909
 * @param {Array} arr - An array of arrays of values to be combined
 */
math.cartesianProduct = function (arr) {
  return arr.reduce( function (a,b) {
    return a.map( function (x) {
      return b.map( function (y) {
        return x.concat(y);
      })
    }).reduce( function (a,b) {return a.concat(b)}, [])
  }, [[]])
};
/**
 * Round a decimal number to decimalPlaces
 * @param {number} x - the number to round
 * @param {number} d - decimal places
 */
math.round = function (x,d) {
  var roundingFactor = Math.pow(10, d);
  return Math.round((x + Number.EPSILON) * roundingFactor) / roundingFactor;
};
/**
 * Compute the sum of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.sum = function (data) {
  function add( a, b) {return a + b;}
  return data.reduce( add, 0);
};
/**
 * Compute the max/min of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.max = function (data) {
  return Math.max( ...data);
};
math.min = function (data) {
  return Math.min( ...data);
};
/**
 * Compute the arithmetic mean of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.mean = function (data) {
  return math.sum( data) / data.length;
};
/**
 * Compute the standard deviation of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.stdDev = function (data) {
  var m = math.mean( data);
  return Math.sqrt( data.reduce( function (acc, x) {
    return acc + Math.pow( x - m, 2);}, 0) / (data.length - 1));
};
// Returns a random number between min (inclusive) and max (exclusive)
math.getUniformRandomNumber = function (min, max) {
  return Math.random() * (max - min) + min;
}
// Returns a random integer between min (included) and max (included)
math.getUniformRandomInteger = function (min, max) {
  return Math.floor( Math.random() * (max - min + 1)) + min;
}
/**
 * Compute the confidence interval of an array of numbers. Based on
 *   Efron, B. (1985). Bootstrap confidence intervals for a class of parametric
 *   problems. Biometrika, 72(1), 45-58.
 * @param {Array<number>} data - An array of numbers
 * @param {number} samples - Number of bootstrap samples (default 10000)
 * @param {number} alpha - Confidence interval to estimate [0,1] (default 0.95)
 * @returns {{lowerBound:number, upperBound:number}} Lower and upper bound of confidence interval
 */
math.confInt = function ( data, samples, alpha ) {
  var n = samples || 10000;
  var p = alpha || 0.95;
  var mu = Array( n );
  var m = math.mean( data );
  var len = data.length;
  // Calculate bootstrap samples
  for (let i = 0; i < n; i++) {
    let t = 0;
    for (let j = 0; j < len; j++) {
      t += data[ Math.floor( Math.random() * len ) ];
    }
    mu[ i ] = ( t / len ) - m;
  }
  // Sort in ascending order
  mu.sort((a,b) => a - b);
  // Return the lower and upper confidence interval
  return {
    lowerBound: m - mu[ Math.floor( Math.min( n - 1,
        n * ( 1 - ( ( 1 - p ) / 2 ) ) ) ) ],
    upperBound: m - mu[ Math.floor( Math.max( 0, n * ( ( 1 - p ) / 2 ) ) ) ]
  };
};
/**
 * Define summary statistics record
 */
math.stat = Object.create( null);
math.stat.summary = {
  average: {label:"Average", f: math.mean},
  stdDev: {label:"Std.dev.", f: math.stdDev},
  min: {label:"Minimum", f: math.min},
  max: {label:"Maximum", f: math.max},
  confIntLowerBound: {label: "CI Lower", f: function ( data ) {
      math.stat.CurrentCI = math.confInt( data ); // {lowerBound: x, upperBound: y}
      return math.stat.CurrentCI.lowerBound;
  }},
  confIntUpperBound: {label: "CI Upper", f: function () {
      return math.stat.CurrentCI.upperBound;
  }}
};
var idb=function(e){"use strict";let t,n;const r=new WeakMap,o=new WeakMap,s=new WeakMap,a=new WeakMap,i=new WeakMap;let c={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return o.get(e);if("objectStoreNames"===t)return e.objectStoreNames||s.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return p(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function u(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(n||(n=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(f(this),t),p(r.get(this))}:function(...t){return p(e.apply(f(this),t))}:function(t,...n){const r=e.call(f(this),t,...n);return s.set(r,t.sort?t.sort():[t]),p(r)}}function d(e){return"function"==typeof e?u(e):(e instanceof IDBTransaction&&function(e){if(o.has(e))return;const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",s),e.removeEventListener("abort",s)},o=()=>{t(),r()},s=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",s),e.addEventListener("abort",s)});o.set(e,t)}(e),n=e,(t||(t=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some(e=>n instanceof e)?new Proxy(e,c):e);var n}function p(e){if(e instanceof IDBRequest)return function(e){const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",s)},o=()=>{t(p(e.result)),r()},s=()=>{n(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",s)});return t.then(t=>{t instanceof IDBCursor&&r.set(t,e)}).catch(()=>{}),i.set(t,e),t}(e);if(a.has(e))return a.get(e);const t=d(e);return t!==e&&(a.set(e,t),i.set(t,e)),t}const f=e=>i.get(e);const l=["get","getKey","getAll","getAllKeys","count"],D=["put","add","delete","clear"],v=new Map;function b(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(v.get(t))return v.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=D.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!o&&!l.includes(n))return;const s=async function(e,...t){const s=this.transaction(e,o?"readwrite":"readonly");let a=s.store;r&&(a=a.index(t.shift()));const i=await a[n](...t);return o&&await s.done,i};return v.set(t,s),s}return c=(e=>({...e,get:(t,n,r)=>b(t,n)||e.get(t,n,r),has:(t,n)=>!!b(t,n)||e.has(t,n)}))(c),e.deleteDB=function(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",()=>t()),p(n).then(()=>{})},e.openDB=function(e,t,{blocked:n,upgrade:r,blocking:o,terminated:s}={}){const a=indexedDB.open(e,t),i=p(a);return r&&a.addEventListener("upgradeneeded",e=>{r(p(a.result),e.oldVersion,e.newVersion,p(a.transaction))}),n&&a.addEventListener("blocked",()=>n()),i.then(e=>{s&&e.addEventListener("close",()=>s()),o&&e.addEventListener("versionchange",()=>o())}).catch(()=>{}),i},e.unwrap=f,e.wrap=p,e}({});
