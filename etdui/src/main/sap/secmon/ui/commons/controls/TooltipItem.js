jQuery.sap.declare("sap.secmon.ui.commons.controls.TooltipItem");

/**
 * Constructor for a new TooltipItem to be used with the
 * sap.secmon.ui.commons.controls.Tooltip.
 * 
 * @param {string}
 *            [sId] id for the new control, generated automatically if no id is
 *            given
 * @param {object}
 *            [mSettings] initial settings for the new TooltipItem
 * @class
 */
sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.TooltipItem", {
    metadata : {

        properties : {
        // no properties so far
        },

        aggregations : {
            leftContent : {
                type : "sap.ui.core.Control",
                multiple : false
            },
            rightContent : {
                type : "sap.ui.core.Control",
                multiple : false
            }
        }
    }

});