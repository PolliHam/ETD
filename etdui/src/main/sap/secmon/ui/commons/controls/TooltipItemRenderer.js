jQuery.sap.declare("sap.secmon.ui.commons.controls.TooltipItemRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.TooltipItem.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.TooltipItemRenderer = {};

sap.secmon.ui.commons.controls.TooltipItemRenderer.render = function(oRm, oControl) {
    oRm.write("<tr");
    oRm.writeControlData(oControl);
    oRm.writeAttribute("tabindex", "-1");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    // left content rendering
    oRm.write("<td>");
    oRm.renderControl(oControl.getLeftContent());
    oRm.write("</td>");

    // right content rendering
    oRm.write("<td>");
    oRm.renderControl(oControl.getRightContent());
    oRm.write("</td>");

    oRm.write("</tr>");
};