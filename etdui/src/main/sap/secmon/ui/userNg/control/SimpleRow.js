sap.ui.define(["sap/ui/core/Control"], function(Control) {
	"use strict";

	/////////////////////////////////////////////// Class Definition ///////////////////////////////////////////////

	var SimpleRow = Control.extend("sap.secmon.ui.userNg.control.SimpleRow", {
		metadata: {
			properties: {
				visible: { // Overwrite invisible renderer from core and use the actual renderer
					type: "boolean",
					defaultValue: true
				}
			},
			aggregations: {
				cells: {
					singularName: "cell",
					type: "sap.ui.core.Control",
					multiple: true
				}
			},
			defaultAggregation: "cells"
		},

		renderer: {

			render: function(oRm, oControl) {
				if (oControl.getVisible() === false) {
					// If we use the standard invisible-placeholder from the
					// core rendermanager, the rows might be rendered out of
					// place by some browsers as the placeholder is not allowed
					// inside a table and thus is moved outside. When the row
					// turns visible again the placeholder (now outside the
					// table) is replaced with the actual content the row is
					// outside the table
					oRm.write("<tr");
					oRm.writeInvisiblePlaceholderData(oControl);
					oRm.write(">");
					oRm.write("<td colspan=\"" + oControl.getCells().length + "\"></td>");
					oRm.write("</tr>");
					return;
				}

				oRm.write("<tr");
				oRm.writeControlData(oControl);
				oRm.addStyle("display", oControl.getVisible() ? "table-row" : "none");
				oRm.writeStyles();
				oRm.write(">");

				var aColumns = oControl.getParent().getColumns();
				oControl.getCells().forEach(function(oCell, i) {
					// Invisible Columns will not contain any cells
					if (aColumns.length > 0 && !aColumns[i].getVisible()) {
						return;
					}

					oRm.write("<td");
					var sColSpan = oCell.data("colspan");
					if (sColSpan) {
						oRm.write(" colspan=\"");
						oRm.writeEscaped(sColSpan);
						oRm.write("\"");
					}
					var sRowSpan = oCell.data("rowspan");
					if (sRowSpan) {
						oRm.write(" rowspan=\"");
						oRm.writeEscaped(sRowSpan);
						oRm.write("\"");
					}

					var sWidth = oCell.data("width");
					if (sWidth) {
						oRm.addStyle("width", sWidth);
					}
					var sMinWidth = oCell.data("minWidth");
					if (sMinWidth) {
						oRm.addStyle("min-width", sMinWidth);
					}
					var sTextAlign = oCell.data("textAlign");
					if (sTextAlign) {
						oRm.addStyle("text-align", sTextAlign);
					}
					oRm.writeStyles();
					oRm.write(">");



					oRm.renderControl(oCell);
					oRm.write("</td>");
				});

				oRm.write("</tr>");
			}
		}

	});

	/////////////////////////////////////////////// Control Lifecycle //////////////////////////////////////////////

	SimpleRow.prototype.init = function() {
	};

	return SimpleRow;

});