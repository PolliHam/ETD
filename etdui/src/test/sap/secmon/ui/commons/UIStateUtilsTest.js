jQuery.sap.require("sap.secmon.ui.commons.UIStateUtils");

describe("UIStateUtils", function() {   
    
    beforeEach(function() {
      //this is here needed, because at the first line the dots are replaces with slashes
        jQuery.sap.require("jquery.sap.storage");
    });
    
    it("create set und get UIState", function() {
        
       var sUIStateId = sap.secmon.ui.commons.UIStateUtils.createUIStateId();
       var oState = {
           selectedIndex : 5
       };
       sap.secmon.ui.commons.UIStateUtils.putUIState(sUIStateId, oState);
       var oStatefromUtils = sap.secmon.ui.commons.UIStateUtils.getUIState(sUIStateId);
       
       expect(oStatefromUtils.selectedIndex).toBe(oState.selectedIndex);
       
       sUIStateId = sap.secmon.ui.commons.UIStateUtils.createUIStateId();
       oStatefromUtils = sap.secmon.ui.commons.UIStateUtils.getUIState(sUIStateId);
       expect(oStatefromUtils).toBe(null);
    });
});