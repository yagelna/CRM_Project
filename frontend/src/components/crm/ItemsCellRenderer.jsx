class ItemsCellRenderer {
  eGui;

  init(params) {
    const count = params.value;
    this.eGui = document.createElement("span");

    if (!count || count === 0) {
      this.eGui.setAttribute("class", "text-muted fst-italic");
      this.eGui.innerHTML = "No items";
    } else {
      this.eGui.setAttribute("class", "badge bg-info");
      this.eGui.innerHTML = `${count} item${count === 1 ? '' : 's'}`;
    }
  }

  getGui() {
    return this.eGui;
  }

  refresh(params) {
    return false;
  }
}

export default ItemsCellRenderer;
