jQuery.sap.require("sap.secmon.ui.commons.controls.LongTapLink");

sap.ui.core.Control.extend("sap.secmon.ui.m.commons.controls.LinkOrText", {

    /**
     * Control is a link if linkEnabled is true, and a text if linkEnabled is false. If busyEnabled is true then sap.m.BusyIndicator is shown. The .setBusy(true) looks strange in forms
     */
    metadata : {

        properties : {
            text : {
                type : "string"
            },

            tooltip : {
                type : "string",
                defaultValue : ""
            },
            linkEnabled : {
                type : "boolean",
                defaultValue : false
            },
            busyEnabled : {
                type : "boolean",
                defaultValue : false
            },
            href : {
                type : "string"
            },
            wrapping : {
                type : "boolean",
                defaultValue : true
            }
        },
        aggregations : {
            _link : {
                type : "sap.secmon.ui.commons.controls.LongTapLink",
                multiple : false,
                visibility : "hidden"
            },
            _text : {
                type : "sap.m.Text",
                multiple : false,
                visibility : "hidden"
            },
            _busy : {
                type : "sap.m.BusyIndicator",
                multiple : false,
                visibility : "hidden"
            }
        },
        events : {
            "press" : {
                enablePreventDefault : false
            }
        }
    },

    _onPress : function(oEvent) {
        this.firePress();
    },

    init : function() {
        var oControl = this;
        if (sap.ui.core.Control.prototype.init) {
            sap.ui.core.Control.prototype.init.apply(this, arguments);
        }
        // create link and text control and delegate press event to link control
        this.setAggregation("_busy", new sap.m.BusyIndicator(), true);
        this.setAggregation("_text", new sap.m.Text(), /* suppress invalidate */true);
        this.setAggregation("_link", new sap.secmon.ui.commons.controls.LongTapLink({
            press : oControl._onPress.bind(oControl)
        // needs to be done like this in order to transfer BindingContext to
        // link press event
        }), /* suppress invalidate */true);

    },

    renderer : {
        render : function(oRM, oControl) {
            oRM.write("<div");
            oRM.writeControlData(oControl);
            oRM.write(">");
            var oAggregation;
            if (oControl.getBusyEnabled() === true) {
                // call busy indicator renderer
                oAggregation = oControl.getAggregation("_busy");
                oAggregation.setSize("1rem");
                oRM.renderControl(oAggregation);
            } else {
                if (oControl.getLinkEnabled() === true) {
                    oAggregation = oControl.getAggregation("_link");
                    if (oControl.getTooltip() !== "") {
                        oAggregation.setTooltip(oControl.getTooltip());
                        // setUrl cannot be done in the onInit method, because
                        // url is undefined at this moment
                    }
                    if (oControl.getHref() !== undefined && oControl.getHref() !== "") {
                        oAggregation.setHref(oControl.getHref());
                    }
                    // call link renderer
                    oAggregation.setWrapping(oControl.getWrapping());
                    oAggregation.setText(oControl.getText());
                    oRM.renderControl(oAggregation);
                } else {// call text renderer
                    oAggregation = oControl.getAggregation("_text");
                    if (oControl.getTooltip() !== "") {
                        oAggregation.setTooltip(oControl.getTooltip());
                    }
                    oAggregation.setWrapping(oControl.getWrapping());
                    oAggregation.setText(oControl.getText());
                    oRM.renderControl(oAggregation);
                }
            }
            oRM.write("</div>");
        }
    },

});
