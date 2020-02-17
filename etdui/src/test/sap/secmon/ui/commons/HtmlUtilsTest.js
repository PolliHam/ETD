jQuery.sap.require("sap.secmon.ui.commons.HtmlUtils");

describe("HtmlUtils", function() {   
    
    function convertHtml(origHtml, newHtml){
        var origDom, newDom, newHtml; 
        origDom = jQuery.parseHTML(origHtml)[0];
        newDom = sap.secmon.ui.commons.HtmlUtils.cleanupHtmlDom(origDom);
        newHtml = jQuery(newDom).html().trim();
        return newHtml;
    }
    
    it("cleanupHtmlDom", function() {
       var origHtml, newHtml; 
       // on a copy&paste action, the HTML text is always embedded in a DIV
       origHtml = "<div><p>a paragraph</p><p>another paragraph</p></div>";
       newHtml = convertHtml(origHtml);
       expect(newHtml).toBe("a paragraph another paragraph");
       
       origHtml = "<div>hello,<p>a paragraph</p><p>another paragraph</p> and goodbye</div>";
       newHtml = convertHtml(origHtml);
       expect(newHtml).toBe("hello, a paragraph another paragraph and goodbye");
       
       origHtml = "<div>hello,<p>a paragraph</p><p>another paragraph</p></div>";
       newHtml = convertHtml(origHtml);
       expect(newHtml).toBe("hello, a paragraph another paragraph");
       
       origHtml = "<div><p>a paragraph</p><p>another paragraph</p> and goodbye</div>";
       newHtml = convertHtml(origHtml);
       expect(newHtml).toBe("a paragraph another paragraph and goodbye");
       
       origHtml = '<div><p>a paragraph</p><p>another paragraph</p> and pic <img href="imago" /></div>';
       newHtml = convertHtml(origHtml);
       // Caution: I havwen't found a way to force XHTML.
       // The browser(?) creates HTML from the DOM.
       expect(newHtml).toContain('a paragraph another paragraph and pic <img href="imago"');
    });
});