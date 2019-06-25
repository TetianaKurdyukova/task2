function onPageDelete(id) {
    $.ajax({
        url: '/admin/delete',
        type: 'DELETE',
        data: {pageId: id},
        success: function() {
            document.location.reload();
        }
    });
}