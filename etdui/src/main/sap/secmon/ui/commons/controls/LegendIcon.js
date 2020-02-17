jQuery.sap.declare("sap.secmon.ui.commons.controls.LegendIcon");
/**
 * Constructor for a new LegendIcon to be used with the
 * sap.secmon.ui.commons.controls.Legend.
 * 
 * @param {String}
 *            src - The source to an image or a SAP Icon of the IconPool, e.g.
 *            sap-icon://settings
 * 
 * Default value: no icon
 * 
 * @param {String}
 *            type - The type of the icon if no source is given. Possible
 *            geometric shapes: "circle", "rectangle", "triangle", "plus",
 *            "cross"
 * 
 * Default value: "circle"
 * 
 * @param {String}
 *            color - The color of the icon or geometric shape. Can be any valid
 *            HTML color or rgb function.
 * 
 * Default value: "black"
 * 
 * @param {sap.ui.core.CSSSize}
 *            width - The image width of this LegendIcon. This value is only
 *            used for icons that are not sap-icons (e.g. external image files).
 * 
 * Default value: "20px"
 * 
 * @param {sap.ui.core.CSSSize}
 *            height - The image height of this LegendIcon. This value is only
 *            used for icons that are not sap-icons (e.g. external image files).
 * 
 * Default value: "20px"
 * 
 * @class
 */
sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.LegendIcon", {
    metadata : {

        properties : {
            src : {
                type : "string"
            },
            type : {
                type : "string",
                defaultValue : "circle"
            },
            color : {
                type : "string",
                defaultValue : "black"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "20px"
            },
            height : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "20px"
            }
        }
    }
});