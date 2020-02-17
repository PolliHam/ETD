describe("valuelist Formatter Tests", function(){
	jQuery.sap.require("sap.secmon.ui.m.valuelist.util.Formatter");
	var libUnderTest;
	var spy;
	var oModel;
	var oBindingContext;
	beforeEach(function() {
		libUnderTest = sap.secmon.ui.m.valuelist.util.Formatter;
	});

	afterEach(function() {
	});
	beforeEach(function() {
		spy = jasmine.createSpyObj("controller", ["getModel", "getBindingContext"]);
		oModel = jasmine.createSpyObj("oModel",["getProperty", "getData"]);
		oBindingContext = jasmine.createSpyObj("oBindingContext", ["getProperty", "getModel", "getPath"]);
		var oFormatter = jasmine.createSpyObj("oFormatter",["dateFormatter"]);
		
		oFormatter.dateFormatter.and.returnValue("Datum");
		spy.oCommons = {};
		spy.oCommons.Formatter = oFormatter;
	});
	it("is systemNAmespaceFormatter with undefined", function() {
		expect(libUnderTest.isSystemNamespaceFormatter()).toBe(null);
	});
	it("is systemNAmespaceFormatter with null", function() {
		expect(libUnderTest.isSystemNamespaceFormatter(null)).toBe(null);
	});
	it("is systemNamespace with invalid namespace", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getData.and.returnValue({NameSpaces : []});
		expect(libUnderTest.isSystemNamespaceFormatter.call(spy, "Namespace")).toBeFalsy();
	});
	it("is systemNamespace with valid namespace", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
		expect(libUnderTest.isSystemNamespaceFormatter.call(spy, "Namespace")).toBeTruthy();
	});
	it("isSystemNsAndDisplay with null", function() {
		expect(libUnderTest.isSystemNsAndDisplayMode()).toBe(null);
	});
	it("isSystemNsAndDisplay with undefined", function() {
		expect(libUnderTest.isSystemNsAndDisplayMode(null)).toBe(null);
	});
	it("isSystemNsAndDisplay with valid ns", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
		expect(libUnderTest.isSystemNsAndDisplayMode.call(spy, "Namespace", true)).toBeTruthy();
	});
	
	
	it("tablemodeFormatter enabled", function(){
	    expect(libUnderTest.tableModeFormatter(true, true)).toEqual("MultiSelect");
	    expect(libUnderTest.tableModeFormatter(false, true)).toEqual("None");
	    expect(libUnderTest.tableModeFormatter(true, false)).toEqual("None");
	    expect(libUnderTest.tableModeFormatter(false, false)).toEqual("None");
	});
	
	it("isSystemNsAndNotUsed with null/undefined used", function() {
	    spy.getModel.and.returnValue(oModel);
	    // check with invalid namespace and array is undefined/null. authorized is true
            oModel.getData.and.returnValue({NameSpaces : []});
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, null)).toBeFalsy();
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, undefined)).toBeFalsy();
            
	    // check with invalid namespace and array is undefined/null. authorized is false
            oModel.getData.and.returnValue({NameSpaces : []});
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, null)).toBeFalsy();
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, undefined)).toBeFalsy();

            // check with valid namespace and array is undefined/null. Authorized is true
            oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, null)).toBeTruthy();
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, undefined)).toBeTruthy();
            
            // check with valid namespace and array is undefined/null. Authorized is false
            oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, null)).toBeFalsy();
            expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, undefined)).toBeFalsy();
	});
	
	it("isSystemNsAndNotUsed valuelist is not used", function() {
        spy.getModel.and.returnValue(oModel);
        // check with invalid namespace and arraylength is 0
        oModel.getData.and.returnValue({NameSpaces : []});
        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, [])).toBeFalsy();
        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, [])).toBeFalsy();

        // check with valid namespace  and arraylength is 0
        oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, [])).toBeTruthy();
        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, [])).toBeFalsy();
    });
	
	it("isSystemNsAndNotUsed valuelist is used", function() {
	        spy.getModel.and.returnValue(oModel);
	        // check with invalid namespace and arraylength is 1
	        oModel.getData.and.returnValue({NameSpaces : []});
	        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, ["abc"])).toBeFalsy();
	        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, ["abc"])).toBeFalsy();

	        // check with valid namespace  and arraylength is 1
	        oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
	        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", true, ["abc"])).toBeFalsy();
	        expect(libUnderTest.isSystemNsAndNotUsed.call(spy, "Namespace", false, ["abc"])).toBeFalsy();
	});
	
	it("isSystemNsAndDisplay with valid ns and displayMode false", function() {
	        spy.getModel.and.returnValue(oModel);
	        oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
	        expect(libUnderTest.isSystemNsAndDisplayMode.call(spy, "Namespace", false)).toBeFalsy();
	    });
	it("defaultNamespaceFormatter with undefined", function() {
		expect(libUnderTest.defaultNamespaceFormatter()).toBe(null);
	});
	it("defaultNamespaceFormatter with null", function() {
		expect(libUnderTest.defaultNamespaceFormatter(null)).toBe(null);
	});
	it("is defaultNamespaceFormatter  with invalid namespace", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getData.and.returnValue({NameSpaces : []});
		expect(libUnderTest.defaultNamespaceFormatter .call(spy, "Namespace")).toEqual(undefined);
	});
	it("is defaultNamespaceFormatter  with valid namespace", function() {
		spy.getModel.and.returnValue(oModel);
		oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
		expect(libUnderTest.defaultNamespaceFormatter .call(spy, "Namespace")).toEqual("Namespace");
	});
	
	/**
	 * Removal of all values is only allowed in DISPLAY mode.
	 * If in MANUAL update mode: All values can be removed if there is at least one value.
	 * If in AUTOMATED update mode: Only if all values are foreign values and at least 1 value exists
	 */
	it("test 'remove all' button for values, allowed in display mode", function(){
	    // Parameters: displayMode, updateMode, localNamespacesCount, valueCount
	    // in EDIT mode: Always false
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "MANUAL", 0, 0)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "MANUAL", 0, 1)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "MANUAL", 1, 1)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "MANUAL", 1, 2)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "MANUAL", 2, 1)).toBeFalsy();
	    
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "AUTOMATED", 0, 0)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "AUTOMATED", 0, 1)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "AUTOMATED", 1, 1)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "AUTOMATED", 1, 2)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(false, "AUTOMATED", 2, 1)).toBeFalsy();
	    
	    // in DISPLAY mode and MANUAL update mode: Enabled if at least one value is available
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "MANUAL", 0, 0)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "MANUAL", 0, 1)).toBeTruthy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "MANUAL", 1, 1)).toBeTruthy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "MANUAL", 1, 2)).toBeTruthy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "MANUAL", 2, 1)).toBeTruthy();
	        
	    // in DISPLAY mode and AUTOMATED update mode: Enabled if at least one foreign value is available
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "AUTOMATED", 0, 0)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "AUTOMATED", 0, 1)).toBeTruthy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "AUTOMATED", 1, 1)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "AUTOMATED", 1, 2)).toBeFalsy();
	    expect(libUnderTest.hasOnlyForeignNamespaceInDisplayMode(true, "AUTOMATED", 2, 1)).toBeFalsy();
	});
	
    /**
     * Removal of selected values is only allowed in DISPLAY mode.
     * If in MANUAL update mode: Any value can be selected and removed if there is at least one value.
     * If in AUTOMATED update mode: Only if selected values are foreign values and at least 1 value exists
     */
    it("test 'remove' button for selected values, allowed in display mode", function(){
        // Parameters: displayMode, updateMode, foreignNamespacesCount, valueCount
        // in EDIT mode: Always false
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "MANUAL", 0, 0)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "MANUAL", 0, 1)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "MANUAL", 1, 1)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "MANUAL", 1, 2)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "MANUAL", 2, 1)).toBeFalsy();
        
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "AUTOMATED", 0, 0)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "AUTOMATED", 0, 1)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "AUTOMATED", 1, 1)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "AUTOMATED", 1, 2)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(false, "AUTOMATED", 2, 1)).toBeFalsy();
        
        // in DISPLAY mode and MANUAL update mode: Enabled if at least one value is available
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "MANUAL", 0, 0)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "MANUAL", 0, 1)).toBeTruthy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "MANUAL", 1, 1)).toBeTruthy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "MANUAL", 1, 2)).toBeTruthy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "MANUAL", 2, 1)).toBeTruthy();
            
        // in DISPLAY mode and AUTOMATED update mode: Enabled if at least one foreign value is available
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "AUTOMATED", 0, 0)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "AUTOMATED", 0, 1)).toBeFalsy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "AUTOMATED", 1, 1)).toBeTruthy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "AUTOMATED", 1, 2)).toBeTruthy();
        expect(libUnderTest.hasForeignNamespaceInDisplayMode(true, "AUTOMATED", 2, 1)).toBeTruthy();
    });
    
    /**
     * EDIT button is enabled if UI is in DISPLAY mode, and there is something to edit:
     * - Values in local namespace
     * - or the valuelist header itself if the valuelist is in local namespace.
     * In AUTOMATED update mode, the EDIT button is invisible.
     */
    it("test enabledness of EDIT button", function(){
	spy.getModel.and.returnValue(oModel);
	oModel.getData.and.returnValue({"userPrivileges": {"ValuelistWrite" : true}});
	
	
        // Parameters: displayMode, localNamespacesCount, updateMode, authorized
        // In EDIT mode, the EDIT button is never enabled
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 1, "MANUAL", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 1, "AUTOMATED", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 0, "MANUAL", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 0, "AUTOMATED", true)).toBeFalsy();
        
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 1, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 1, "AUTOMATED", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 0, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,false, 0, "AUTOMATED", false)).toBeFalsy();
        
        // in DISPLAY mode
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 1, "MANUAL", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 1, "AUTOMATED", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 0, "MANUAL", true)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 0, "AUTOMATED", true)).toBeFalsy();
        
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 1, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 1, "AUTOMATED", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 0, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.hasLocalNamespaceAndDisplayMode.call(spy,true, 0, "AUTOMATED", false)).toBeFalsy();
    });
    
    /**
     * The buttons to add values are only enabled in DISPLAY mode, and if the valuelist may be modified manually
     */
    it("test enabledness of buttons: add, upload, and fill from events", function(){
        // Parameters: displayMode, updateMode, authorized
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, "MANUAL", true)).toBeTruthy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, "AUTOMATED", true)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, null, true)).toBeTruthy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false, "MANUAL", true)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false, "AUTOMATED", true)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false)).toBeFalsy();
        
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, "AUTOMATED", false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(true, null, false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false, "MANUAL", false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false, "AUTOMATED", false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateMode(false)).toBeFalsy();
    });
    
    /**
     * Each value is selectable only in DISPLAY mode (for removal).
     * If in MANUAL update mode, any value can be removed.
     * If in AUTOMATED update mode, only foreign values may be removed.
     */
    it("test enabledness of checkboxes for each value", function(){
        spy.getModel.and.returnValue(oModel);
        oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "LocalNamespace"}]});
        
        //spy.getModel.and.returnValue(oModel);
        //oModel.getData.and.returnValue({NameSpaces : [{NameSpace : "Namespace"}]});
        
        // Parameters: displayMode, updateMode, currentNameSpace
        // In EDIT mode, checkboxes are always disabled
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,false)).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,false, "MANUAL")).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,false, "AUTOMATED")).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,false, "AUTOMATED", "LocalNamespace")).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,false, "AUTOMATED", "ForeignNamespace")).toBeFalsy();
        
        // In DISPLAY mode, checkboxes are enabled for foreign values
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,true)).toBeTruthy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,true, "MANUAL")).toBeTruthy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,true, "AUTOMATED")).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,true, "AUTOMATED", "LocalNamespace")).toBeFalsy();
        expect(libUnderTest.isDisplayAndManualUpdateModeInForeignNS.call(spy,true, "AUTOMATED", "ForeignNamespace")).toBeTruthy();       
    });
	
	
	it("uncheckCheckBox in any mode", function() {
	    // The formatter is abused as an event handler.
	    // Every time a change event for values "displayMode" and "UpdateMode" is received, the checkboxes are reset.
	    expect(libUnderTest.uncheckCheckBox()).toBeFalsy();
	    expect(libUnderTest.uncheckCheckBox(true)).toBeFalsy();
	    expect(libUnderTest.uncheckCheckBox(false)).toBeFalsy();
		expect(libUnderTest.uncheckCheckBox(true, "AUTOMATED")).toBeFalsy();
		expect(libUnderTest.uncheckCheckBox(true, "MANUAL")).toBeFalsy();
	    expect(libUnderTest.uncheckCheckBox(false, "AUTOMATED")).toBeFalsy();
	    expect(libUnderTest.uncheckCheckBox(false, "MANUAL")).toBeFalsy();
	});

	it("valueExist with value", function() {
		expect(libUnderTest.valuesExist (-1)).toBe(false);
	});
	it("valueExist with value", function() {
		expect(libUnderTest.valuesExist (0)).toBe(false);
	});
	it("valueExist with value", function() {
		expect(libUnderTest.valuesExist (1)).toBe(true);
	});
	it("valueExist with value", function() {
		expect(libUnderTest.valuesExist (undefined)).toBe(false);
	});
	it("setLineType", function() {
        expect(libUnderTest.setLineType(true, "0")).toBe("Inactive");
        expect(libUnderTest.setLineType(true, "1")).toBe("Navigation");
        expect(libUnderTest.setLineType(false, "0")).toBe("Inactive");
    });
	it("publishedFormatter", function() {
        expect(libUnderTest.publishedFormatter("0", "yes", "no")).toBe("no");
        expect(libUnderTest.publishedFormatter("1", "yes", "no")).toBe("yes");
	});
	
    it("publishedFormatter", function() {
        expect(libUnderTest.fillFromEventsConfirmButonEnabledFormatter(null)).toBe(false);
        expect(libUnderTest.fillFromEventsConfirmButonEnabledFormatter(undefined)).toBe(false);
        expect(libUnderTest.fillFromEventsConfirmButonEnabledFormatter("SystemIdActor")).toBe(true);
    });
	it("isSystemNsAndEditMode with undefined namespace", function() {
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'MANUAL', undefined)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'MANUAL', true)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'MANUAL', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'MANUAL', false)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'AUTOMATED', undefined)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'AUTOMATED', true)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'AUTOMATED', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (undefined, 'AUTOMATED', false)).toBeFalsy();
	});
    it("isSystemNsAndEditMode with null namespace", function() {
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'MANUAL', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'MANUAL', true)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'MANUAL', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'MANUAL', false)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'AUTOMATED', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'AUTOMATED', true)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'AUTOMATED', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (null, 'AUTOMATED', false)).toBeFalsy();

    });
    it("isSystemNsAndEditMode with missing editMode", function() {
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'MANUAL', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'MANUAL', null)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'MANUAL', false)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'MANUAL', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'MANUAL', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'MANUAL', false)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', null)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', false)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', undefined)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', null)).toBeFalsy();
        expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', false)).toBeFalsy();
   });
   it("isSystemNsAndEditMode with 'AUTOMATED' updateMode", function() {
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', undefined)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', undefined)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', null)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', true)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', true)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (true, 'AUTOMATED', false)).toBeFalsy();
		expect(libUnderTest.isSystemNsAndUpdatemodAndEditMode (false, 'AUTOMATED', false)).toBeFalsy();
});
   it("updateUrlFormatter ", function() {
       var address = location.protocol + '//' + location.host; 
       var base64 = sap.secmon.ui.m.valuelist.util.Formatter.oCommons.hexToBase64('00');
       expect(libUnderTest.updateUrlFormatter(base64)).toBe(address + "/sap/secmon/services/api/valuelist/00");
       base64 = sap.secmon.ui.m.valuelist.util.Formatter.oCommons.hexToBase64('AA');
       expect(libUnderTest.updateUrlFormatter(base64)).toBe(address + "/sap/secmon/services/api/valuelist/AA");
   });  
});