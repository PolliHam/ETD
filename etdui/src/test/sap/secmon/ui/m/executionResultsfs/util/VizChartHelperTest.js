jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.VizChartHelper");
jQuery.sap.require("test.TestHelper");

describe("VizChartHelper", function(){
    var libUnderTest, controller;
    beforeEach(function() {
        controller = jasmine.createSpyObj("controller", ["getText",  "getView"]);
        controller.getText.and.callFake(function(x){return x;})
        libUnderTest = sap.secmon.ui.m.executionResultsfs.util.VizChartHelper;
        libUnderTest.setController(controller);
    });


    it("generateVizPropertiesBarChart with default palette", function() {
        var vizProperty =  libUnderTest.generateVizPropertiesBarChart({xAxis : {
            type : 'x',
            title : 'Title'
        },
        yAxis :{
            type : 'y',
            title : 'NewTitle'
        } }, "ChartTitle");
       expect(controller.getText).toHaveBeenCalled();
       expect(vizProperty.hasOwnProperty("legend")).toBeTruthy();
       expect(vizProperty.legend.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.visible).toBeFalsy();
       expect(vizProperty.legend.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("text")).toBeTruthy();
       expect(vizProperty.title.text).toEqual("ChartTitle");
       expect(vizProperty.legend.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.title.visible).toBeFalsy();
       expect(vizProperty.hasOwnProperty("x")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("y")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("plotArea")).toBeTruthy();
       expect(vizProperty.plotArea.hasOwnProperty("dataLabel")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.visible).toBeFalsy();
       expect(vizProperty.plotArea.hasOwnProperty("colorPalette")).toBeTruthy();
       expect(typeof vizProperty.plotArea.colorPalette).toBe("object");
       expect(vizProperty.plotArea.colorPalette).toEqual(["sapUiChartPaletteSemanticNeutral"]);
       expect(vizProperty.plotArea.hasOwnProperty("dataPointSize")).toBeTruthy();
       expect(vizProperty.plotArea.dataPointSize.hasOwnProperty("min")).toBeTruthy();
       expect(vizProperty.plotArea.dataPointSize.hasOwnProperty("max")).toBeTruthy();
       
    });
    it("generateVizPropertiesBarChart with custom palette", function() {
        var vizProperty =  libUnderTest.generateVizPropertiesBarChart({xAxis : {
            type : 'x',
            title : 'Title'
        },
        yAxis :{
            type : 'y',
            title : 'NewTitle'
        } }, "ChartTitle", ["red", "green"]);
       expect(controller.getText).toHaveBeenCalled();
       expect(vizProperty.hasOwnProperty("legend")).toBeTruthy();
       expect(vizProperty.legend.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.visible).toBeFalsy();
       expect(vizProperty.legend.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("text")).toBeTruthy();
       expect(vizProperty.title.text).toEqual("ChartTitle");
       expect(vizProperty.legend.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.title.visible).toBeFalsy();
       expect(vizProperty.hasOwnProperty("x")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("y")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("plotArea")).toBeTruthy();
       expect(vizProperty.plotArea.hasOwnProperty("dataLabel")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.visible).toBeFalsy();
       expect(vizProperty.plotArea.hasOwnProperty("colorPalette")).toBeTruthy();
       expect(typeof vizProperty.plotArea.colorPalette).toBe("object");
       expect(vizProperty.plotArea.colorPalette).toEqual(["red", "green"]);
       expect(vizProperty.plotArea.hasOwnProperty("dataPointSize")).toBeTruthy();
       expect(vizProperty.plotArea.dataPointSize.hasOwnProperty("min")).toBeTruthy();
       expect(vizProperty.plotArea.dataPointSize.hasOwnProperty("max")).toBeTruthy();
       
    });
    it("generateVizPropertiesBubleChart", function() {
        var vizProperty =  libUnderTest.generateVizPropertiesBubleChart({xAxis : {
            type : 'x',
            title : 'Title'
        },
        yAxis :{
            type : 'y',
            title : 'NewTitle'
        } }, "ChartTitle");
       expect(controller.getText).toHaveBeenCalled();
       expect(vizProperty.hasOwnProperty("legend")).toBeTruthy();
       expect(vizProperty.legend.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.visible).toBeFalsy();
       expect(vizProperty.legend.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("title")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.title.hasOwnProperty("text")).toBeTruthy();
       expect(vizProperty.title.text).toEqual("ChartTitle");
       expect(vizProperty.legend.title.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.legend.title.visible).toBeFalsy();
       expect(vizProperty.hasOwnProperty("x")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("y")).toBeTruthy();
       expect(vizProperty.hasOwnProperty("plotArea")).toBeTruthy();
       expect(vizProperty.plotArea.hasOwnProperty("dataLabel")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.hasOwnProperty("visible")).toBeTruthy();
       expect(vizProperty.plotArea.dataLabel.visible).toBeFalsy();
       expect(vizProperty.plotArea.hasOwnProperty("colorPalette")).toBeFalsy();
       
       expect(vizProperty.plotArea.hasOwnProperty("dataPointSize")).toBeFalsy();
     
    });
    it("connectPopoverToChart with chartObject", function() {
        var chart = jasmine.createSpyObj("chart", ["getVizUid"]);
        chart.getVizUid.and.returnValue("id");
        var view = jasmine.createSpyObj("view", ["byId"]);
        var popOver = jasmine.createSpyObj("popOver", ["connect"]);
        controller.getView.and.returnValue(view);
        view.byId.and.returnValue(popOver);
        libUnderTest.connectPopoverToChart(chart, "Id");
        expect(popOver.connect).toHaveBeenCalledWith("id");
    });
});