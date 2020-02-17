jQuery.sap.declare("sap.secmon.ui.commons.controls.LegendRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.Legend.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.LegendRenderer = {};

sap.secmon.ui.commons.controls.LegendRenderer.render = function(oRm, oControl) {
    oRm.write("<div");
    oRm.addClass("sapEtdLegend");
    // remove the focus glow when clicking in the area:
    oRm.addStyle("outline", "none");

    oRm.writeControlData(oControl);
    oRm.writeAttribute("tabindex", "-1");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    oRm.write("<table>");

    oControl.getItems().forEach(function(tooltipItem) {
        oRm.renderControl(tooltipItem);
    });

    oRm.write("</table>");

    oRm.write("</div>");
};