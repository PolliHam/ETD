sap.ui.define(["sap/ui/core/Control"], function(Control) {
	"use strict";

	/////////////////////////////////////////////// Class Definition ///////////////////////////////////////////////

	var SimpleTable = Control.extend("sap.secmon.ui.userNg.control.SimpleTable", {

		metadata: {
			properties: {
				width: {
					type: "string", // "sap.ui.core.CSSSize" does not currently support "vh" and "vw"
					defaultValue: ""
				},
				minWidth: {
					type: "string", // "sap.ui.core.CSSSize" does not currently support "vh" and "vw"
					defaultValue: null
				},
				height: {
					type: "string", // "sap.ui.core.CSSSize" does not currently support "vh" and "vw"
					defaultValue: ""
				}
			},
			aggregations: {
				rows: {
					singularName: "row",
					type: "sap.ui.core.Control",
					multiple: true
				},
				columns: {
					singularName: "column",
					type: "sap.ui.core.Control",
					multiple: true
				}
			},
			defaultAggregation: "rows"
		},

		renderer: {
			render: function(oRm, oControl) {
				oRm.write("<table");
				oRm.writeControlData(oControl);
				oRm.addClass("etdsimpletable");
				oRm.writeClasses();
				if (oControl.getWidth()) {
					oRm.addStyle("width", oControl.getWidth());
				}
				if (oControl.getHeight()) {
					oRm.addStyle("height", oControl.getHeight());
				}
				if (oControl.getMinWidth()) {
					oRm.addStyle("min-width", oControl.getMinWidth());
				}
				oRm.writeStyles();
				oRm.write(">");

				var aColumns = oControl.getColumns();

				// Only show header if columns are defined
				if (aColumns.length > 0) {
					oRm.write("<thead>");
					oRm.write("<tr>");
					oControl.getColumns().forEach(function(oColumn) {
						if (!oColumn.getVisible()) {
							return;
						}

						oRm.write("<th");
						var sWidth = oColumn.data("width");
						if (sWidth) {
							oRm.addStyle("width", sWidth);
						}
						var sMinWidth = oColumn.data("minWidth");
						if (sMinWidth) {
							oRm.addStyle("min-width", sMinWidth);
						}
						oRm.writeStyles();
						oRm.write(">");
						oRm.renderControl(oColumn);
						oRm.write("</th>");
					});
					oRm.write("</tr>");
					oRm.write("</thead>");
				}

				oControl.getRows().forEach(function(oRow) {
					oRm.renderControl(oRow);
				});

				oRm.write("</table>");
			}
		}

	});


	/////////////////////////////////////////////// Control Lifecycle //////////////////////////////////////////////

	SimpleTable.prototype.init = function() {};

	return SimpleTable;

});