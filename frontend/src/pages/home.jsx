const Home = () => {
    return (
        <div>
        <h1>Home Page</h1>
        
          <div class="list-group list-group-horizontal" id="list-tab" role="tablist">
            <a class="list-group-item list-group-item-action active" data-bs-toggle="list" href="#home" role="tab">Quote</a>
            <a class="list-group-item list-group-item-action" data-bs-toggle="list" href="#profile" role="tab">T/P Alert</a>
            <a class="list-group-item list-group-item-action" data-bs-toggle="list" href="#messages" role="tab">No Stock</a>
            <a class="list-group-item list-group-item-action" data-bs-toggle="list" href="#settings" role="tab">MOV Requirement</a>
            <a class="list-group-item list-group-item-action" data-bs-toggle="list" href="#settings" role="tab">No Export</a>
          </div>
          
        </div>
        
    );
}

export default Home;