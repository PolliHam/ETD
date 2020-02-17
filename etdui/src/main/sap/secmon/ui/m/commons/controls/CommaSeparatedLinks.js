jQuery.sap.require("sap.secmon.ui.commons.controls.LongTapLink");
jQuery.sap.declare("sap.secmon.ui.m.commons.controls.TextWithLinks");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/commons/controls/TextWithLinks.css");
sap.ui.core.Control.extend("sap.secmon.ui.m.commons.controls.CommaSeparatedLinks", {

    /**
     * Control is a Text with Links combined in one Textblock. Several Links are supported. The links are displayed comma-separated.
     */
    metadata : {
        properties : {
            /**
             * <code>
             * links = [{ 
             *      Text : <Name>,
             *      Url: <Url> },
             *      { 
             *      Text : <Name2>,
             *      Url: <Url2> } ]
             * </code>
             */
            links : {
                type : "object[]",
                defaultValue : []
            },
            openInAnotherTab : {
                type : "boolean",
                defaultValue : true
            }
        },
        aggregations : {
            _longtaplink : {
                type : "sap.secmon.ui.commons.controls.LongTapLink",
                multiple : false,
                visibility : "hidden"
            },
            _normallink : {
                type : "sap.m.Link",
                multiple : false,
                visibility : "hidden"
            },
            _text : {
                type : "sap.m.Text",
                multiple : false,
                visibility : "hidden"
            },
        },
    },

    init : function() {
        if (sap.ui.core.Control.prototype.init) {
            sap.ui.core.Control.prototype.init.apply(this, arguments);
        }
        this.setAggregation("_text", new sap.m.Text(), true);
        this.setAggregation("_normallink", new sap.m.Link({
            wrapping : true,
            target : "_blank"
        }), true);
        this.setAggregation("_longtaplink", new sap.secmon.ui.commons.controls.LongTapLink(), true);
    },

    renderer : {
        render : function(oRM, oControl) {
            oRM.write("<div");
            oRM.writeControlData(oControl);
            oRM.write(">");

            var aLinks = oControl.getLinks();
            var oText = oControl.getAggregation("_text");
            oText.addStyleClass("ownText");
            var oLink = (oControl.getOpenInAnotherTab()) ? oControl.getAggregation("_normallink") : oControl.getAggregation("_longtaplink");

            oLink.addStyleClass("ownLink");
            aLinks.forEach(function(link, index) {
                if (index > 0) {
                    oText.setText(", ");
                    oRM.renderControl(oText);
                }
                oLink.setText(aLinks[index].Text);
                oLink.setHref(aLinks[index].Url);
                oRM.renderControl(oLink);
            });
            oRM.write("</div>");
        }
    },
});