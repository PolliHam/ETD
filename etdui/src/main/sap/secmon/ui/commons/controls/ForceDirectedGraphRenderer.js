jQuery.sap.declare("sap.secmon.ui.commons.controls.ForceDirectedGraphRenderer");

/**
 * Renderer for sap.secmon.ui.commons.controls.ForceDirectedGraph.
 * 
 * @namespace
 */
sap.secmon.ui.commons.controls.ForceDirectedGraphRenderer = {};

sap.secmon.ui.commons.controls.ForceDirectedGraphRenderer.render = function(oRm, oControl) {
    // control div
    oRm.write("<div");
    oRm.writeControlData(oControl);
    oRm.addStyle("position", "relative");
    oRm.writeStyles();
    oRm.writeClasses();
    oRm.write(">");

    // Simple tag container for injection
    oRm.write("<graph");
    oRm.writeAttribute("id", oControl._getGraphId());
    oRm.addStyle("position", "relative");
    oRm.addStyle("float", "left"); // float left due to legend
    oRm.addStyle("width", oControl.getWidth());
    oRm.addStyle("height", oControl.getHeight());

    // make legend invisible after fading out:
    oRm.addStyle("overflow", "hidden");
    oRm.writeStyles();
    oRm.write(">");

    // Render tooltip if available
    if (oControl.getTooltip()) {
        oRm.renderControl(oControl.getTooltip());
    }

    // legend div
    oRm.write("<div");
    oRm.writeAttribute("id", oControl.getId() + "_legend");
    oRm.addStyle("position", "absolute");
    oRm.addStyle("top", "50px");

    // if legend should not be visible, move it to the right
    // to enable fade in when it is set to visible later on.
    if (oControl.getShowLegend()) {
        oRm.addStyle("right", "0px");
    } else {
        oRm.addStyle("right", "-" + oControl._LEGEND_WIDTH + "px");
    }

    oRm.addStyle("width", oControl.getWidth());
    oRm.addStyle("height", oControl.getHeight());

    if (oControl.getShowLegend()) {
        oRm.addStyle("width", oControl._LEGEND_WIDTH + "px");
    } else {
        oRm.addStyle("width", "0px");
    }

    oRm.writeStyles();
    oRm.write(">");

    // insert legend content if given
    if (oControl.getLegend()) {
        oRm.renderControl(oControl.getLegend());
    }

    // close legend div
    oRm.write("</div>");

    oRm.write("</graph>");
    // close control div
    oRm.write("</div>");
};