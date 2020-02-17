jQuery.sap.declare("sap.secmon.ui.commons.controls.LegendItem");
jQuery.sap.require("sap.secmon.ui.commons.controls.LegendIcon");

/**
 * Constructor for a new LegendItem to be used with the
 * sap.secmon.ui.commons.controls.Legend.
 * 
 * @param {String}
 *            text - The text to display
 * 
 * Default value: ""
 * 
 * @param {Boolean}
 *            isTitle - If isTitle is set to true this LegendItem is rendered as
 *            a title of the Legend. This can be used for sub-titles as well.
 * 
 * Default value: false
 * 
 * @param {sap.secmon.ui.commons.controls.LegendIcon}
 *            icon - An optional instance of
 *            sap.secmon.ui.commons.controls.LegendIcon to depict an icon at the
 *            beginning of this LegendItem.
 * 
 * Default value: undefined
 * 
 * @class
 */
sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.LegendItem", {
    metadata : {

        properties : {
            text : {
                type : "string"
            },
            isTitle : {
                type : "boolean",
                defaultValue : false
            }
        },

        aggregations : {
            icon : {
                type : "sap.secmon.ui.commons.controls.LegendIcon",
                multiple : false
            }
        }
    }

});