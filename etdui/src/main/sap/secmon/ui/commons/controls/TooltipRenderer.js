jQuery.sap.declare("sap.secmon.ui.commons.controls.TooltipRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.Tooltip.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.TooltipRenderer = {};

sap.secmon.ui.commons.controls.TooltipRenderer.render = function(oRm, oControl) {
    oRm.write("<div");
    oRm.addClass("sapEtdTooltip");

    if (oControl.getVisible()) {
        oRm.addStyle("opacity", ".9");
        oRm.addStyle("display", "block");
    } else {
        oRm.addStyle("opacity", "0");
        oRm.addStyle("display", "none");
    }

    oRm.addStyle("left", oControl.getLeft() + "px");
    oRm.addStyle("top", oControl.getTop() + "px");

    oRm.writeControlData(oControl);
    oRm.writeAttribute("tabindex", "-1");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    oRm.write("<table>");

    // render close button if desired
    if (oControl.getShowCloseButton()) {
        oRm.renderControl(oControl.getAggregation("_closeButton"));
    }

    oControl.getItems().forEach(function(tooltipItem) {
        oRm.renderControl(tooltipItem);
    });

    oRm.write("</table>");

    oRm.write("</div>");
};