jQuery.sap.declare("sap.secmon.ui.m.commons.controls.SortableColumn");

jQuery.sap.require("sap.m.Column");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortOrder");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortableItem");

/**
 * this column remembers its sorting state
 */

(function() {

    var SortableColumn = sap.m.Column.extend("sap.secmon.ui.m.commons.controls.SortableColumn", {
        metadata : {
            properties : {
                sortOrder : {
                    type : "string",
                    group : "Appearance",
                    defaultValue : "Ascending"
                },
                sortProperty : {
                    type : "string",
                    group : "Behavior",
                    defaultValue : null
                },
                sorted : {
                    type : "boolean",
                    group : "Appearance",
                    defaultValue : false
                }
            },
        }
    });

    SortableColumn.prototype.setSorted = function(bSorted) {
        if (bSorted) {
            if (this.getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Ascending) {
                this.getHeader().setIcon(sap.ui.core.IconPool.getIconURI("sort-ascending"));
            } else {
                this.getHeader().setIcon(sap.ui.core.IconPool.getIconURI("sort-descending"));
            }
        } else {
            this.getHeader().setIcon("");
        }

        this.setProperty("sorted", bSorted);
    };

    SortableColumn.prototype.setSortOrder = function(sortOrder) {
        if (this.getSorted()) {
            if (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Ascending) {
                this.getHeader().setIcon(sap.ui.core.IconPool.getIconURI("sort-ascending"));
            } else {
                this.getHeader().setIcon(sap.ui.core.IconPool.getIconURI("sort-descending"));
            }
        } else {
            this.getHeader().setIcon("");
        }

        this.setProperty("sortOrder", sortOrder);
    };

})();
