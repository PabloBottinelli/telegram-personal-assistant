export class FakeSpreadsheet {
  constructor() {
    this.sheets = new Map();
  }

  insertSheet(name, headers = []) {
    const sheet = new FakeSheet(name, headers);
    this.sheets.set(name, sheet);
    return sheet;
  }

  getSheetByName(name) {
    return this.sheets.get(name) || null;
  }
}

export class FakeSheet {
  constructor(name, headers = []) {
    this.name = name;
    this.values = [headers];
  }

  getName() {
    return this.name;
  }

  getLastRow() {
    for (let i = this.values.length - 1; i >= 0; i--) {
      if (this.values[i].some(v => String(v ?? "").trim() !== "")) {
        return i + 1;
      }
    }
    return 0;
  }

  getLastColumn() {
    return Math.max(...this.values.map(r => r.length), 0);
  }

  getRange(row, col, numRows = 1, numCols = 1) {
    if (typeof row === "string") {
      return FakeRange.fromA1Notation(this, row);
    }

    return new FakeRange(this, row, col, numRows, numCols);
  }

  deleteRow(rowNumber) {
    this.values.splice(rowNumber - 1, 1);
  }

  appendRow(row) {
    this.values.push(row);
    return this;
  }
}

class FakeRange {
  static fromA1Notation(sheet, notation) {
    const match = String(notation).match(/^([A-Z]+)(\d+):([A-Z]+)$/i);

    if (!match) {
      throw new Error(`FakeSheet.getRange no soporta la notación: ${notation}`);
    }

    const startCol = columnLetterToNumber_(match[1]);
    const startRow = Number(match[2]);
    const endCol = columnLetterToNumber_(match[3]);

    const numCols = endCol - startCol + 1;
    const numRows = Math.max(sheet.values.length - startRow + 1, 1);

    return new FakeRange(sheet, startRow, startCol, numRows, numCols);
  }

  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const out = [];

    for (let r = 0; r < this.numRows; r++) {
      const row = [];

      for (let c = 0; c < this.numCols; c++) {
        row.push(this.getCell_(this.row + r, this.col + c));
      }

      out.push(row);
    }

    return out;
  }

  setValues(values) {
    if (!Array.isArray(values) || !Array.isArray(values[0])) {
      throw new Error(
        `setValues espera una matriz 2D. Recibió: ${JSON.stringify(values)}`
      );
    }

    for (let r = 0; r < values.length; r++) {
      for (let c = 0; c < values[r].length; c++) {
        this.setCell_(this.row + r, this.col + c, values[r][c]);
      }
    }

    return this;
  }

  getValue() {
    return this.getCell_(this.row, this.col);
  }

  setValue(value) {
    this.setCell_(this.row, this.col, value);
    return this;
  }

  sort(sortSpec) {
    const headerRows = 1;
    const startIndex = headerRows;
    const rows = this.sheet.values.slice(startIndex);

    const sortColIndex = sortSpec.column - 1;
    const ascending = sortSpec.ascending !== false;

    rows.sort((a, b) => {
      const av = a[sortColIndex];
      const bv = b[sortColIndex];

      const at = av instanceof Date ? av.getTime() : String(av ?? "");
      const bt = bv instanceof Date ? bv.getTime() : String(bv ?? "");

      if (at < bt) return ascending ? -1 : 1;
      if (at > bt) return ascending ? 1 : -1;
      return 0;
    });

    this.sheet.values = [
      this.sheet.values[0],
      ...rows
    ];

    return this;
  }

  getCell_(row, col) {
    const r = row - 1;
    const c = col - 1;

    if (!this.sheet.values[r]) return "";
    return this.sheet.values[r][c] ?? "";
  }

  setCell_(row, col, value) {
    const r = row - 1;
    const c = col - 1;

    while (this.sheet.values.length <= r) {
      this.sheet.values.push([]);
    }

    while (this.sheet.values[r].length <= c) {
      this.sheet.values[r].push("");
    }

    this.sheet.values[r][c] = value;
  }
}

function columnLetterToNumber_(letters) {
  return String(letters)
    .toUpperCase()
    .split("")
    .reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0);
}