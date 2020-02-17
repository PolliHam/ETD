/* globals oTextBundle */
jQuery.sap.declare("sap.secmon.ui.performance.SystemViz");
/**
 * A viz controller in system context
 * 
 * @memberOf sap.secmon.ui.performance.SystemViz
 */

sap.ui.core.Control.extend("sap.secmon.ui.performance.SystemViz", {

    metadata : {
        properties : {

        },
        aggregations : {
            charts : {
                type : "sap.viz.ui5.core.BaseChart",
                multiple : true
            },
            switchBar : {
                type : "sap.ui.commons.layout.HorizontalLayout",
                multiple : false
            },
            mLayout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false
            }

        },
        events : {
            "dataSelected" : {},
        // "resetFiltering" : {}
        }

    },
    /**
     * @memberOf sap.secmon.ui.performance.SystemViz
     */
    sChartTypeSelected : undefined,
    sDimensionsSelected : undefined,
    oCharts : [],

    renderer : {},

    init : function() {
        // create layout
        this.mLayout = new sap.ui.commons.layout.MatrixLayout({
            id : 'matrixLayout',
            columns : 3,
            width : '100%',
            height : "80%",

        });
        this.mLayout.addStyleClass("myMatrixlayoutBGColor");
        // First row => SwitchBar, ResetButton, (?)
        var oRow = new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px"
        });
        this.mLayout.addRow(oRow);
        // add empty cell
        oRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell());
        var oCell = new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Center,
        });
        oRow.addCell(oCell);

        // second row => chart with colspan = 3
        oRow = new sap.ui.commons.layout.MatrixLayoutRow();
        this.mLayout.addRow(oRow);
        oCell = new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Center,
            colSpan : 3
        });
        // set initial chartType
        this.setChartType("Line");
        this.createCharts();
        oCell.addContent(this.getChartSelected().setDataset(this.createDataset()));
        oRow.addCell(oCell);

    },

    createCharts : function() {
        var _that = this;
        var oChart;
        oChart = new sap.viz.ui5.Line("chart:Line", {
            width : "100%",
            height : "100%",
            plotArea : {},
            title : {
                text : oTextBundle.getText("PE_ChartTitel_HANA"), // "{i18n>PE_ChartTitel}",
                visible : true
            },
            selectData : function(oEvent) {
                _that.fireDataSelected({
                    filters : this.selection({
                        withDataCtx : true
                    })
                });
            },
        });
        this.oCharts[0] = oChart;

    },

    createDataset : function() {

        var oDataset;

        oDataset = new sap.viz.ui5.data.FlattenedDataset({
            // a Bar Chart requires exactly one dimension (x-axis)
            dimensions : [ {
                axis : 1, // must be one for the x-axis, 2 for y-axis
                name : 'Timestamp',// "{i18n>SysCtx_Role}",
                value : "{Timestamp}"
            } ],
            // it can show multiple measures, each results in a new set of
            // bars
            // in a new color
            measures : [
            // measure 1
            {
                name : 'Request over all Events (1:100 ms)',
                value : '{CreateChart}' // 'value' defines the binding for the
            // displayed value
            }, {
                name : 'Pattern Job Duration (s)',
                value : '{PatternJob}'
            }, {
                name : 'Used CPU (%)',
                value : '{CPU}'
            }, {
                name : 'Used Memory (%)',
                value : '{MemoryUsage}'
            }, {
                name : 'Memory allocated by Events (%)',
                value : '{EventMemoryUsage}'
            } ],
            data : {
                path : "/",
                model : "PerfData"
            }
        });

        return oDataset;
    },

    setChartType : function(sChartType) {
        this.sChartTypeSelected = sChartType;
    },
    getChartType : function() {
        return this.sChartTypeSelected;
    },

    onBeforeRendering : function() {
    },

    getChartSelected : function() {
        return this.oCharts[0];
    },

});