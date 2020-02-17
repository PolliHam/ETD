$.sap.declare("sap.secmon.ui.browse.TimeRangeCard");

$.sap.require("sap.secmon.ui.browse.AbstractValueSelector");
$.sap.require("sap.secmon.ui.browse.TimeRange");
$.sap.require("sap.ui.commons.AutoCompleteRenderer");
$.sap.require("sap.secmon.ui.browse.utils");

sap.secmon.ui.browse.AbstractValueSelector.extend("sap.secmon.ui.browse.TimeRangeCard", {

    metadata : {
        properties : {
            type : {
                type : "string",
                defaultValue : "Relative"
            }, // Relative | Absolute
            value : {
                type : "any",
            // defaultValue : {
            // relativeValue : {
            // type : "string",
            // defaultValue : C_TIMERANGE.LAST_HOUR
            // },
            // absoluteValue : {
            // from : "20140613T134412",
            // to : "20140614T134412"
            // }
            // },
            }
        },
        aggregations : {
        // layout : {
        // type : "sap.ui.commons.layout.MatrixLayout",
        // multiple : false,
        // visibility : "hidden"
        // }
        },

        events : {
            change : {
                newValue : undefined
            },
        }
    },

    _timeRange : undefined,
    _label : undefined,
    layout : undefined,

    exit : function() {
        if (this._timeRange) {
            this._timeRange.destroy();
            delete this._timeRange;
        }
        if (this._label) {
            this._label.destroy();
            delete this._label;
        }
    },

    init : function() {

        if (sap.secmon.ui.browse.AbstractValueSelector.prototype.init) {
            sap.secmon.ui.browse.AbstractValueSelector.prototype.init.call(this);
        }

        // fetch the layout control from the AbstractValueSelector (inherited)
        this.layout = sap.secmon.ui.browse.AbstractValueSelector.prototype.getAggregation.call(this, "layout");

        this.setModel(sap.ui.getCore().getModel("SelectedFilterModel"));

        this._label = new sap.m.Label({
            text : "{i18n>BU_LBL_TimeRange}"
        });

        this._timeRange = new sap.secmon.ui.browse.TimeRange({
            // width : "200px",
            relativeIntervals : {
                path : "TimeRangeModel>/",
                template : new sap.ui.base.ManagedObject(),
                templateShareable : false
            }
        });

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : this._label
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                content : this._timeRange,
                colSpan : 2
            }) ]
        }));

        this.setAggregation("layout", this.layout);

    },

    onBeforeRendering : function() {

        var sType = this.getType();
        var oValue = this.getValue();

        this._timeRange.setType(sType);
        this._timeRange.setValue(oValue);
    },

    renderer : sap.secmon.ui.browse.AbstractValueSelectorRenderer,

});
