/* globals Timechart */
sap.ui.define([ "sap/ui/core/Control", "sap/secmon/ui/performance/view/Chart/TimeChart-d3" ], function(Control, TimeChart) {
    return Control.extend("sap.secmon.ui.performance.view.Chart.TimeChart", {
        metadata : {
            properties : {
                height : {
                    type : "sap.ui.core.CSSSize",
                    defaultValue : "200px"
                },

                width : {
                    type : "sap.ui.core.CSSSize",
                    defaultValue : "500px"
                },

                showLegend : {
                    type : "boolean",
                    defaultValue : "true"
                },

                showTooltip : {
                    type : "boolean",
                    defaultValue : "true"
                }
            },

            aggregations : {
                _html : {
                    type : "sap.ui.core.HTML",
                    multiple : false,
                    visibility : "hidden"
                }
            },

            events : {
                select : {

                },

                deselect : {

                },
                scopeChange : {
                    parameters : {
                        scope : {
                            type : "string"
                        },
                        startDate : {
                            type : "date"
                        },
                        endDate : {
                            type : "date"
                        },
                    }
                }
            }
        },

        _dataSelected : [],

        init : function(oControl) {
            // set Container ID
            this._sContainerId = this.getId() + "--container";
            this.setAggregation("_html", new sap.ui.core.HTML({
                content : "<svg id='" + this._sContainerId + "'></svg>"
            }));
            this._chart = Timechart();
        },

        onBeforeRendering : function(oControl) {
            sap.ui.core.ResizeHandler.deregister(this._sResizeHandlerId);

        },

        renderer : function(oRm, oControl) {
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.write(">");
            oRm.renderControl(oControl.getAggregation("_html"));
            oRm.write("</div>");
        },

        onAfterRendering : function(oControl) {
            this._chart.oConfig.parent = this._sContainerId;

            $('#' + this._sContainerId).css('height', this.getHeight());
            this._chart.oConfig.height = $('#' + this._sContainerId).height();
            $('#' + this._sContainerId).css('width', this.getWidth());
            this._chart.oConfig.width = $('#' + this._sContainerId).width();

            this._chart.oConfig.margin = {
                top : 20,
                right : 20,
                bottom : 110,
                left : 40
            };

            this._chart.oConfig.legendWidth = 50;

            this._chart.oConfig.mainHeight = this._chart.oConfig.height - this._chart.oConfig.margin.top - this._chart.oConfig.margin.bottom;
            this._chart.oConfig.mainWidth = this._chart.oConfig.width - this._chart.oConfig.margin.right - this._chart.oConfig.margin.left;
            this._chart.oConfig.navMargin = {
                top : (this._chart.oConfig.mainHeight + this._chart.oConfig.margin.top + 30),
                right : 100,
                bottom : 30,
                left : 40
            };

            this._chart.oConfig.navWidth = this._chart.oConfig.mainWidth;
            this._chart.oConfig.navHeight = this._chart.oConfig.mainHeight * 0.12;

            this._chart.oConfig.fontSize = 12;
            this._chart.oConfig.dotSize = 3.5;
            this._chart.oConfig.strokeWidth = 2.5;

            this._chart.oConfig.oControl = this;
            this._chart.oConfig.bShowTooltip = this.getShowTooltip();
            this._chart.oConfig.bShowLegend = this.getShowLegend();

            this._sResizeHandlerId = sap.ui.core.ResizeHandler.register(this, jQuery.proxy(this._onResize, this));
            if (!this._bSetupDone) {
                this._chart.render();
                this._bSetupDone = true;
            }
        },

        exit : function() {
            sap.ui.core.ResizeHandler.deregister(this._sResizeHandlerId);
            delete this._chart;
        },

        setScopeData : function(data) {
            this._chart.setScopeData(data);
        },

        _onResize : function(oEvt) {
            this._chart.oConfig.height = oEvt.size.height;
            this._chart.oConfig.width = oEvt.size.width;

            this._chart.oConfig.mainHeight = this._chart.oConfig.height - this._chart.oConfig.margin.top - this._chart.oConfig.margin.bottom;
            this._chart.oConfig.mainWidth = this._chart.oConfig.width - this._chart.oConfig.margin.right - this._chart.oConfig.margin.left;

            this._chart.oConfig.navWidth = this._chart.oConfig.mainWidth;
            this._chart.oConfig.navHeight = this._chart.oConfig.mainHeight * 0.12;
            this._chart.resize();
        },

        setModel : function(oModel, name) {
            this.oModels[name] = oModel;
            if (oModel) {
                this._chart.data(this.getModel().getData());
            }
        }
    });
});
