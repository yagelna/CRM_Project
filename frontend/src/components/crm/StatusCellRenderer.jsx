import React from "react";

class StatusCellRenderer {
    eGui;

    init(params) {
        this.eGui = document.createElement("span");
        this.eGui.setAttribute("class", "badge border border-primary text-primary");
        this.eGui.innerHTML = params.value;
    }

    getGui() {
        return this.eGui;
    }

    refresh(params) {
        return false;
    }

}

export default StatusCellRenderer;