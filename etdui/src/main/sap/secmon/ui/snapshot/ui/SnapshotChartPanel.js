$.sap.declare("sap.secmon.ui.snapshot.ui.SnapshotChartPanel");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.PatternDefinition");
jQuery.sap.require("sap.ui.model.odata.CountMode");
//  

/**
 * A Chartpanel in the Snapshot page
 * 
 * @memberOf sap.secmon.ui.snapshot.SnapshotChartPanel
 */
sap.ui.commons.Panel.extend("sap.secmon.ui.snapshot.ui.SnapshotChartPanel", {

    metadata : {
        properties : {
            chartId : {
                type : "string"
            },
            serializedData : {
                type : "string"
            },
            parentId : {
                type : "string"
            }
        // createdAt : {
        // type : "string"
        // },
        },
        aggregations : {
            // Override derived aggregations buttons, to allow also other ui
            // elements beside of sap.ui.commons.Button
            buttons : {
                type : "sap.ui.core.Control",
                multiple : true
            }
        },
        events : {}
    },

    /**
     * Dropdown and embedded listbox containing the charts/patterns of the workspace
     * 
     * @memberOf sap.secmon.ui.snapshot.SnapshotChartPanel
     */
    oDropdownBox : undefined,

    _oFeedList : undefined,
    _oChart : undefined,
    _oCommentButton : undefined,

    // use the super renderer
    renderer : {},

    init : function() {

        // Call super constructor
        if (sap.ui.commons.Panel.prototype.init) {
            sap.ui.commons.Panel.prototype.init.apply(this, arguments);
        }

        this.setShowCollapseIcon(false);
        var oWorkspaceListModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_QUBE_LIST_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oWorkspaceListModel, "WorkspaceListModel");

        this.setTitle(new sap.ui.core.Title({}));

        this._oChart = new sap.secmon.ui.browse.Chart({
            width : "780px",
            height : "480px",
            refreshMode : {
                mode : "none"
            }
        }).setModel(new sap.ui.model.json.JSONModel());        

        this._oFeedList = new sap.m.List({});
        var oPopover = new sap.m.Popover({
            showHeader : true,
            contentWidth : '300px',
            contentHeight : '350px',
            placement : sap.m.PlacementType.Bottom,
            content : [ new sap.m.FeedInput({
                icon : "sap-icon://employee",
                post : [ function(oEvent) {
                    // UTC data formatter
                    var oUTC = sap.ui.getCore().getModel('applicationContext').getData().UTC;
                    var oUTCDataFormatter = sap.secmon.ui.commons.Formatter.dateFormatterEx(oUTC, new Date());

                    var sPath = this.getBindingContext().getPath();
                    var oData = this.getModel().getProperty(sPath);
                    oData.comments = oData.comments || [];
                    oData.comments.unshift({
                        // get user name for Fiori launchpad
                        user : this.getModel("applicationContext").getProperty("/userName"),
                        timestamp : oUTCDataFormatter,
                        text : oEvent.getParameter("value")
                    });
                    var oSerializedData = JSON.parse(oData.SerializedData);
                    oSerializedData.comments = oData.comments;
                    oData.SerializedData = JSON.stringify(oSerializedData);
                    this.getModel().refresh();

                    if (!this._oFeedList.getModel()) {
                        // set model to feedlist
                        this._oFeedList.setModel(this.getModel());

                        // binding
                        this._oFeedList.bindAggregation("items", sPath + "/comments", new sap.m.FeedListItem({
                            icon : "sap-icon://employee",
                            text : "{text}",
                            timestamp : "{timestamp}",
                            iconDensityAware : false,
                            iconPress : function(oEvent) {
                            },
                            senderPress : function(oEvent) {
                            },
                            sender : "{user}"
                        }));
                    }

                    this._oCommentButton.setText(oData.comments.length);
                }, this ]
            }), this._oFeedList ],

        });

        this._oCommentButton = new sap.ui.commons.Button({
            icon : "sap-icon://comment",
            tooltip : "{i18n>Snapshot_ComBut_Tooltip}",
            press : function() {
                if (oPopover.isOpen()) {
                    oPopover.close();
                } else {
                    oPopover.openBy(this);
                }
            }
        });

        this.addContent(this._oChart);
        this.addButton(this._oCommentButton);
        sap.secmon.ui.browse.utils.createApplicationContextModelSync();
    },

    /**
     * Reads chart data before view gets rendered (all the properties are available now)
     * 
     * @memberOf sap.secmon.ui.snapshot.SnapshotChartPanel
     */
    onBeforeRendering : function() {
        // Call super implementation
        if (sap.ui.commons.Panel.prototype.onBeforeRendering) {
            sap.ui.commons.Panel.prototype.onBeforeRendering.apply(this, arguments);
        }

        if (this.getSerializedData()) {
            this.buildChart();
        }
    },

    /**
     * Reads a given Chart via OData service from data base, and then save it to sap core
     * 
     * @param sQubeId
     */
    buildChart: function () {
        var oChartData = JSON.parse(this.getSerializedData());

        // remove the chartData so this new data can be loaded
        delete oChartData.chartData;

        // period: {operator: "BETWEEN", searchTerms:
        // ["2015-11-20T12:08:06Z",
        // "2015-11-20T13:08:06Z"]}
        oChartData.parentId = this.getParentId();

        // default model of snapshot
        var oSnapshotModel = this.getModel();
        var sPath = this.getBindingContext().getPath();
        var oCurrentSnapshot = oSnapshotModel.getProperty(sPath);

        // overwrite the period with snapshot time range
        if (typeof oCurrentSnapshot.ChartFrom === "string") {

            if (oCurrentSnapshot.ChartFrom.indexOf("/Date") >= 0) {
                oCurrentSnapshot.ChartFrom = new Date(+oCurrentSnapshot.ChartFrom.match(/\d+/)[0]);
                oCurrentSnapshot.ChartTo = new Date(+oCurrentSnapshot.ChartTo.match(/\d+/)[0]);
            } else {
                oCurrentSnapshot.ChartFrom = Date.parse(oCurrentSnapshot.ChartFrom);
                oCurrentSnapshot.ChartTo = Date.parse(oCurrentSnapshot.ChartTo);
            }
        }
        oChartData.period = {
            operator: "BETWEEN",
            searchTerms: [sap.secmon.ui.browse.utils.formatDateTime(oCurrentSnapshot.ChartFrom), sap.secmon.ui.browse.utils.formatDateTime(oCurrentSnapshot.ChartTo)]
        };
        oCurrentSnapshot.chartData = oChartData;

        // trigger chart update
        this._oChart.getModel().setData(oChartData);
        this._oChart.handleFeedsChanged();

        // show title with period
        var utc = sap.ui.getCore().getModel('applicationContext').getData().UTC;
        this.getTitle().setText(
            sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, oCurrentSnapshot.ChartFrom) + " - " + sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, oCurrentSnapshot.ChartTo));

        this.getAggregation("buttons")[0].setText((oCurrentSnapshot.comments || []).length);

        // TODO: this button should not be shown workaround
        this.getAggregation("buttons")[1].setVisible(false);

        // comments
        this._oFeedList.setModel(oSnapshotModel);
        this._oFeedList.bindAggregation("items", sPath + "/comments", new sap.m.FeedListItem({
            icon: "sap-icon://employee",
            text: "{text}",
            timestamp: "{timestamp}",
            iconDensityAware: false,
            iconPress: function (oEvent) {
            },
            senderPress: function (oEvent) {
            },
            sender: "{user}"
        }));

    }
});