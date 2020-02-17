/* globals d3 */
jQuery.sap.declare("sap.secmon.ui.commons.controls.Tooltip");
jQuery.sap.require("sap.secmon.ui.commons.controls.TooltipItem");
jQuery.sap.require("sap.m.Button");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/Tooltip.css");

/**
 * Constructor for a new Tooltip.
 * 
 * @param {Boolean}
 *            showCloseButton - Whether the tooltip should display a small
 *            button which closes the tooltip.
 * 
 * Default value: true if the current device supports touch, false otherwise
 * 
 * @param {Boolean}
 *            visible - Whether the tooltip is visible or not.
 * 
 * Default value: false
 * 
 * @param {Float}
 *            left - The absolute left position of the tooltip to its next
 *            parent with position:absolute or position:relative. Note: The
 *            consumer of the tooltip has to take care that there is a parent
 *            DOM element with position:relative or position:absolute in order
 *            to place the tooltip at the desired left/top position.
 * 
 * Default value: 0
 * 
 * @param {Float}
 *            top - The absolute top position of the tooltip to its next parent
 *            with position:absolute or position:relative. Note: The consumer of
 *            the tooltip has to take care that there is a parent DOM element
 *            with position:relative or position:absolute in order to place the
 *            tooltip at the desired left/top position.
 * 
 * Default value: 0
 * 
 * @param {sap.secmon.ui.commons.controls.TooltipItem[]}
 *            items - The tooltip items that should be content of the tooltip.
 * 
 * Default value: []
 * 
 * @event
 * @param {Function}
 *            beforeShow - This event is fired just before the tooltip appears
 *            on the screen. This is the moment where the content can be
 *            adjusted. Use the source parameter of the event to get details of
 *            the object firing this event.
 * 
 * @event
 * @param {Function}
 *            beforeClose - This event is fired just before the tooltip
 *            disappears from the screen. Note: Preventing the default behavior
 *            of the event is currently not supported.
 * 
 * @class
 */
sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.Tooltip", {
    metadata : {

        properties : {
            showCloseButton : {
                type : "boolean",
                defaultValue : sap.ui.Device.support.touch
            },
            visible : {
                type : "boolean",
                defaultValue : false
            },
            left : {
                type : "float",
                defaultValue : 0
            },
            top : {
                type : "float",
                defaultValue : 0
            }
        },

        defaultAggregation : "items",

        aggregations : {
            items : {
                type : "sap.secmon.ui.commons.controls.TooltipItem",
                singularName : "item",
                multiple : true
            },
            _closeButton : {
                type : "sap.m.Button",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            "beforeShow" : {
                enablePreventDefault : false
            },
            "beforeClose" : {
                enablePreventDefault : false
            }
        }
    },

    init : function() {
        var tooltip = this;
        var closeButton = new sap.m.Button({
            type : "Transparent",
            icon : "sap-icon://decline",
            press : function() {
                tooltip.fireBeforeClose.call(tooltip);
                tooltip.setVisible(false);
            }
        }).addStyleClass("sapEtdTooltipCloseButton").addStyleClass("sapUiSizeCompact");

        this.setAggregation("_closeButton", closeButton);
    },

    /**
     * Returns the surrounding parent container.
     */
    _getTooltipContainer : function() {
        return this._getTooltipNode().parentNode;
    },

    /**
     * Returns the d3 node element of this control.
     */
    _getTooltipNode : function() {
        return d3.select("#" + this.getId()).node();
    },

    /**
     * Returns the maximum top/left values according to the parent DOM elements'
     * bounding rectangle dimension including a small padding.
     */
    _getBoundingLimits : function() {
        var tooltipContainer = this._getTooltipContainer();
        var boundingRect = tooltipContainer.getBoundingClientRect();

        return {
            height : boundingRect.height - 24,
            width : boundingRect.width - 24
        };
    },

    /**
     * Returns the dimension (width/height) of this control including its
     * content.
     */
    _getTooltipDimension : function() {
        var $node = jQuery("#" + this.getId());
        var width = $node.width();
        var height = $node.height();

        return {
            width : width,
            height : height
        };
    }
});

/**
 * Places the tooltip at the best suitable position close to the given fTop and
 * fLeft parameter. Note: If you want to place the tooltip at a certain position
 * without any corrections done by the control use setTop/setLeft instead.
 * 
 * @param {Float}
 *            fTop - The pixels from the top.
 * @param {Float}
 *            fLeft - The pixels from the left.
 */
sap.secmon.ui.commons.controls.Tooltip.prototype.placeAt = function(fTop, fLeft) {
    var top = fTop, left = fLeft;
    var limits = this._getBoundingLimits();
    var tooltipDimension = this._getTooltipDimension();
    var mouseMargin = 32;

    // check left/right position:
    if ((left + tooltipDimension.width / 2) > limits.width) {
        left = limits.width - tooltipDimension.width;
    } else if (left - tooltipDimension.width / 2 < 0) {
        left = 0;
    } else {
        left = left - tooltipDimension.width / 2;
    }

    // check bottom/top position:
    if (top - mouseMargin - tooltipDimension.height < 0) {
        top = top + (mouseMargin * 2);
    } else {
        top = top - mouseMargin - tooltipDimension.height;
    }

    this.setTop(top).setLeft(left);
};