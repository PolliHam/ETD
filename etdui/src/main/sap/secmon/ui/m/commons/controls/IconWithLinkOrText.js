jQuery.sap.declare("sap.secmon.ui.m.commons.controls.IconWithLinkOrText");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.LinkOrText");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/commons/controls/IconWithLinkOrText.css");
sap.secmon.ui.m.commons.controls.LinkOrText.extend("sap.secmon.ui.m.commons.controls.IconWithLinkOrText", {

    /**
     * Control is a link if linkEnabled is true, and a text if linkEnabled is false. If an Icon is set it is displayed at the beginning of the line. If no icon.src is set no icon is displayed. The
     * Text/Link gets a left padding of 1rem if an Icon is set. busyEnabled (feature of linkOrText) IS NOT SUPPORTED
     */
    metadata : {
        properties : {
            iconSrc : {
                type : "sap.ui.core.URI",
                defaultValue : undefined
            },
            iconSize : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "1rem"
            },
            iconColor : {
                type : "string",
                defaultValue : "grey"
            },
            wrapping : {
                type : "boolean",
                defaultValue : true
            }
        },
        aggregations : {
            _icon : {
                type : "sap.ui.core.Icon",
                multiple : false,
                visibility : "hidden"
            },
        },
    },

    init : function() {
        if (sap.secmon.ui.m.commons.controls.LinkOrText.prototype.init) {
            sap.secmon.ui.m.commons.controls.LinkOrText.prototype.init.apply(this, arguments);
        }
        this.setAggregation("_icon", new sap.ui.core.Icon(), true);
    },

    renderer : {
        render : function(oRm, oControl) {
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.write(">");
            var oAggregation;
            if (oControl.getIconSrc() !== undefined && oControl.getIconSrc() !== "") {
                oAggregation = oControl.getAggregation("_icon");
                oAggregation.setSrc(oControl.getIconSrc());
                oAggregation.addStyleClass("Icon");
                if (oControl.getIconSize !== undefined) {
                    oAggregation.setSize(oControl.getIconSize());
                }
                if (oControl.getIconColor !== undefined) {
                    oAggregation.setColor(oControl.getIconColor());
                }
                oRm.renderControl(oAggregation);

                if (oControl.getLinkEnabled() === true) {
                    oControl.getAggregation("_link").addStyleClass("LinkOrText");
                } else {
                    oControl.getAggregation("_text").addStyleClass("LinkOrText");
                }
            }
            if (oControl.getLinkEnabled() === true) { // call link renderer
                oAggregation = oControl.getAggregation("_link");
                if (oControl.getTooltip() !== "") {
                    oAggregation.setTooltip(oControl.getTooltip());
                }
                oAggregation.setWrapping(true);
                oAggregation.setText(oControl.getText());
                oRm.renderControl(oAggregation);
            } else { // call text renderer
                oAggregation = oControl.getAggregation("_text");
                if (oControl.getTooltip() !== "") {
                    oAggregation.setTooltip(oControl.getTooltip());
                }
                oAggregation.setWrapping(true);
                oAggregation.setText(oControl.getText());
                oRm.renderControl(oAggregation);
            }
            oRm.write("</div>");
        }
    },
});