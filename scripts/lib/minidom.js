"use strict";

function escaped(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

class MiniElement {
  constructor(name, documentObject) {
    this.name = name;
    this.ownerDocument = documentObject;
    this.attributes = {};
    this.children = [];
    this.dataset = {};
    this.textContent = "";
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] === undefined ? null : this.attributes[name]; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  serialize() {
    const attributes = Object.entries(this.attributes).map(([name, value]) => ` ${name}="${escaped(value)}"`).join("");
    const dataset = Object.entries(this.dataset).map(([name, value]) => ` data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${escaped(value)}"`).join("");
    const content = `${this.textContent ? escaped(this.textContent) : ""}${this.children.map((child) => child.serialize()).join("")}`;
    return `<${this.name}${attributes}${dataset}>${content}</${this.name}>`;
  }
}

class MiniDocument {
  createElementNS(_namespace, name) { return new MiniElement(name, this); }
}

module.exports = { escaped, MiniElement, MiniDocument };
