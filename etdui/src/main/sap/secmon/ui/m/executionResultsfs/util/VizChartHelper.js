jQuery.sap.declare("sap.secmon.ui.m.executionResultsfs.util.VizChartHelper");

sap.secmon.ui.m.executionResultsfs.util.VizChartHelper = (function() {
    var controller = null;

    return {

        setController : function(oController) {
            controller = oController;
        },
        generateVizProperties : function(axisObject, title) {
            var vizProps = {};

            vizProps.legend = {
                visible : false,
                title : {
                    visible : false
                }
            };
            vizProps[axisObject.xAxis.type] = {
                visible : true,
                label : {
                    hideSubLevels : true
                },
                title : {
                    visible : true,
                    text : controller.getText(axisObject.xAxis.title)
                }
            };
            vizProps[axisObject.yAxis.type] = {
                visible : true,
                title : {
                    visible : true,
                    text : controller.getText(axisObject.yAxis.title)
                }
            };
            vizProps.title = {
                text : controller.getText(title),
                visible : true
            };

            return vizProps;

        },
        generateVizPropertiesBarChart : function(axisObject, title, palette) {

            var colorPalette = [], dataPointStyle = {
                rules : []
            };
            var vizProperties = this.generateVizProperties(axisObject, title);

            if (!palette) {
                colorPalette = [ "sapUiChartPaletteSemanticNeutral" ];
            } else {
                palette.forEach(function(color) {
                    if (typeof color === "string") {
                        colorPalette.push(color);
                    } else {
                        dataPointStyle.rules.push({
                            dataContext : color.dataContext,
                            properties : {
                                color : color.color
                            }
                        });

                    }
                });
            }

            vizProperties.plotArea = {
                dataLabel : {
                    visible : false
                },
                colorPalette : colorPalette,
                dataPointStyle : dataPointStyle,
                dataPointSize : {
                    min : 10,
                    max : 15
                }
            };
            if (vizProperties.plotArea.colorPalette.length === 0) {
                delete vizProperties.plotArea.colorPalette;
            }
            return vizProperties;
        },
        generateVizPropertiesBubleChart : function(axisObject, title) {
            var vizProperties = this.generateVizProperties(axisObject, title);
            vizProperties.plotArea = {
                dataLabel : {
                    visible : false,
                    hideWhenOverlap : true
                }
            };
            return vizProperties;
        },

        connectPopoverToChart : function(chart, popOverId) {
            var chartObject;
            if (typeof chart === "object") {
                chartObject = chart;
            } else {
                chartObject = controller.getView().byId(chart);
            }

            var popOver = controller.getView().byId(popOverId);
            popOver.connect(chartObject.getVizUid());
        }

    };
}());