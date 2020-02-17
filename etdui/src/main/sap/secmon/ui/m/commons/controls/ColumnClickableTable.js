jQuery.sap.declare("sap.secmon.ui.m.commons.controls.ColumnClickableTable");

jQuery.sap.require("sap.m.Table");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortOrder");

/**
 * this table enhances each column by setting the cursor and fires an columnPress-event when the user has clicked on a sortable column
 */

(function() {

    sap.m.Table.extend("sap.secmon.ui.m.commons.controls.ColumnClickableTable", {
        metadata : {
            properties : {
                firstColumnIsForSelection : {
                    type : "boolean",
                    defaultValue : true
                }
            },
            events : {
                columnPress : {}
            }
        },

        renderer : function(oRm, oControl) {
            sap.m.TableRenderer.render(oRm, oControl);
        },

        onAfterRendering : function() {
            sap.m.Table.prototype.onAfterRendering.apply(this, arguments);
            var $headers = $(this.getDomRef()).find("th");

            $headers.each(function(index, header) {
                if (index === 0 && this.getProperty("firstColumnIsForSelection") === true) {
                    return;
                }

                // Caution: Arrays aColumns and $headers might have a different
                // sort order (e.g. after manual column sort in settings popup).
                var headerContentId = header.firstChild ? header.firstChild.id : null;
                if (!headerContentId) {
                    return;
                }
                var aFoundColumns = this.getColumns().filter(function(column) {
                    var id = column.getHeader() ? column.getHeader().getId() : "";
                    return id === headerContentId;
                });
                var column = aFoundColumns[0];
                if (!column) {
                    return;
                }
                if (column instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                    var $header = $(header);

                    $header.css('cursor', 'pointer');
                    $header.children().each(function() {
                        $(this).css('cursor', 'pointer');
                    });

                    $header[0].addEventListener("click", function() {
                        var nColumnIndex = $("#" + arguments[0].currentTarget.id).index();

                        if (this.getProperty("firstColumnIsForSelection") === true) {
                            nColumnIndex--;
                        }

                        if (typeof nColumnIndex === "number") {
                            var aColumnsFiltered = [];

                            var aColumns = this.getColumns();
                            var i, column;

                            for (i = 0; i < this.getColumns().length; i++) {
                                column = aColumns[i];

                                if (column.getVisible()) {
                                    aColumnsFiltered.push({
                                        order : column.getOrder(),
                                        column : column
                                    });
                                }
                            }

                            aColumnsFiltered = aColumnsFiltered.sort(function(col1, col2) {
                                if (col1.order < col2.order) {
                                    return -1;
                                } else if (col1.order > col2.order) {
                                    return 1;
                                }

                                return 0;
                            });

                            column = aColumnsFiltered[nColumnIndex].column;
                            if (column && column instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                                var sortOrder;
                                if (column.getSorted()) {
                                    if (column.getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Ascending) {
                                        sortOrder = sap.secmon.ui.m.commons.controls.SortOrder.Descending;
                                    } else {
                                        sortOrder = sap.secmon.ui.m.commons.controls.SortOrder.Ascending;
                                    }
                                } else {
                                    sortOrder = sap.secmon.ui.m.commons.controls.SortOrder.Ascending;
                                }

                                this.fireColumnPress({
                                    column : column,
                                    sortOrder : sortOrder
                                });
                            }
                        }
                    }.bind(this), true);
                }
            }.bind(this));
        }
    });

})();
