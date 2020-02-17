describe("MappedViewSettingsHelper", function(){    
    var libUnderTest;
    var oViewSettingsDialog;
    var urlParameterMappings;
    var queryExtractor;
    afterEach(function() {
    });
    beforeEach(function() {
        
        urlParameterMappings = jasmine.createSpyObj("urlParameterMappings", ["getSupportedOrderByValues","getSupportedUrlParamNames","convertToDBFieldName"]);
        queryExtractor = jasmine.createSpyObj("queryExtractor", ["extractSorter", "extractFilters"]);
        oViewSettingsDialog = jasmine.createSpyObj("oViewSettingsDialog", ["setSortDescending","setSelectedSortItem", "getFilterItems", "getSortItems"]);
        //urlParameterMappings = {};
        urlParameterMappings.getSupportedOrderByValues();
        jQuery.sap.require("sap.secmon.ui.m.commons.MappedViewSettingsHelper");
        
        spyOn(sap.secmon.ui.m.commons,"UrlParameterMappings").and.returnValue(urlParameterMappings);
        spyOn(sap.secmon.ui.m.commons,"QueryExtractor").and.returnValue(queryExtractor);
        libUnderTest = sap.secmon.ui.m.commons.MappedViewSettingsHelper;
        
        
    });
    
    
    it("applyUrlParametersToBindingAndViewSettings should not set a sortDescending", function() {
        oViewSettingsDialog.getFilterItems.and.returnValue([]);
        oViewSettingsDialog.getSortItems.and.returnValue([]);
        libUnderTest.applyUrlParametersToBindingAndViewSettings(oViewSettingsDialog, "Name", {}, "", "");
        expect(oViewSettingsDialog.setSortDescending).not.toHaveBeenCalled();
        expect(oViewSettingsDialog.setSelectedSortItem).not.toHaveBeenCalled();
    });
    it("applyUrlParametersToBindingAndViewSettings should order if QueryObject supplies order", function() {
        var sortItem = jasmine.createSpyObj("sortItem", ["getKey", "setSelected", "getItems", "getBinding"]);
        sortItem.getKey.and.returnValue("Name");
        urlParameterMappings.convertToDBFieldName.and.returnValue("Name");
        urlParameterMappings.getSupportedOrderByValues.and.returnValue(["Name"]);
        urlParameterMappings.getSupportedUrlParamNames.and.returnValue(["Name"]);
        oViewSettingsDialog.getFilterItems.and.returnValue([]);
        oViewSettingsDialog.getSortItems.and.returnValue([sortItem]);
        libUnderTest.applyUrlParametersToBindingAndViewSettings(oViewSettingsDialog, "Name", {orderBy : "Name"}, "", "");
        expect(oViewSettingsDialog.setSortDescending).toHaveBeenCalled();
        expect(oViewSettingsDialog.setSelectedSortItem).toHaveBeenCalledWith(sortItem);
    });
    it("applyUrlParametersToBindingAndViewSettings should filter if QueryObject supplies filter", function() {
        var filterItem = jasmine.createSpyObj("sortItem", ["getKey", "setSelected", "getItems", "getBinding"]);
        var subItem = jasmine.createSpyObj("subItem", ["getKey", "setSelected", "getItems", "getBinding"]);
        filterItem.getItems.and.returnValue([subItem]);
        filterItem.getKey.and.returnValue("Name");
        urlParameterMappings.convertToDBFieldName.and.returnValue("Name");
        urlParameterMappings.getSupportedOrderByValues.and.returnValue(["Name"]);
        urlParameterMappings.getSupportedUrlParamNames.and.returnValue(["Name"]);
        oViewSettingsDialog.getFilterItems.and.returnValue([filterItem]);
        oViewSettingsDialog.getSortItems.and.returnValue([]);
        libUnderTest.applyUrlParametersToBindingAndViewSettings(oViewSettingsDialog, "Name", {filterBy : "Name"}, "", "");
        expect(oViewSettingsDialog.setSortDescending).not.toHaveBeenCalled();
        expect(oViewSettingsDialog.setSelectedSortItem).not.toHaveBeenCalled();
        expect(subItem.setSelected).toHaveBeenCalledWith(false);
        //expect(oViewSettingsDialog.)
    });

});