import React, { useState, useEffect} from 'react'; 


const Offcanvas = ({id, title, rfqData}) => {

    useEffect(() => {
        console.log("rfqData: ", rfqData);
    },
    [rfqData]);

    return (
        <div class="offcanvas offcanvas-end" tabindex="-1" id={id} aria-labelledby="offcanvasRightLabel">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title" id="offcanvasRightLabel">{rfqData}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                {rfqData}.......
            </div>
        </div>
    );
};
export default Offcanvas;
