# Discrete Event Process Modeling Notation

<h3>Abstract</h3>

Business process management has developed into a mature discipline over the past ten years, with a well-established set of principles, methods, and tools that combine knowledge from industrial engineering, management sciences, and information technology with the aim of enhancing business processes. Discrete Event Process Modeling Notation overcomes standard tools used in BPM by blending the BPMN's intuitive flowchart modeling approach with the strict semantics offered by the Event Graphs' event scheduling arrows and the Object-Event Modeling and Simulation paradigm's event rules.

# Case Study: Online Sneaker Store
A fresh new online shop has finally opened its gates for limited edition sneaker releases. HTTP requests arrive with a random recurrence rates during a sneaker release and the current site is able to to handle only a limited number of requests at the same time. Moreover, if the site has reached its maximum capacity of visitors per time, new clients enter a queue. Clients in a queue may grow impatient and hang up the queue without placing an order. Then customers, in order to buy their dream pair of shoes, have to select the size and add them to the cart. If the requested size isn't available, customers are able to queue one more time and try a different size. Finally, if the selected sneaker is available, customers are able to complete the order. Since sneaker drops are always used as a stress test for a site, the online shop manager asked to keep track of the following key parameter indicator:
<ul>
    <li>Number of lost orders</li>
    <li>Number of total checkouts</li>
    <li>AVG. queue length</li>
    <li>Number of lost orders for size unavailable.</li>
</ul>
<h3>Simulation<h3>
In order to run the simulation just open the index.html file in the Project/New Online Sneaker shop folder.

# Conclusion

Although BPMN is an effective tool for illustrating business processes, its scope is constrained and additional standards must be used to implement it or to include different kinds of activities. Decision Model and Notation is advised for decision flows. A data flow diagram is advised because, despite the fact that BPMN has standards for data objects, it does not account for every stage of the data lifecycle.
By modifying the process diagram language for the goal of simulation-based modeling, where a process model must express a computationally full process specification, DPMN addresses the shortcomings of BPMN. Even though DPMN can retain a significant portion of BPMN's vocabulary, visual syntax, information semantics, and intuitive flowchart modeling style, it also needs to integrate the rigorous semantics offered by the event scheduling arrows of Event Graphs and the event rules of the Object Event Modeling and Simulation paradigm.
In conclusion, the DPMN JavaScript Framework (OESjs) has also been used to demonstrate how effective it is in displaying extensive simulation results, even in simple case studies like the one proposed in this study.

# Future Work

DPMN is an open (non-proprietary) DES modeling language for creating platform-independent simulation design models that may be implemented with any specific DES platform, like AnyLogic, as was previously stated. As a result, as part of future development, we might want to use AnyLogic to construct the Online Sneaker Shop business process model.
Since AnyLogic does not support Activity-Based Discrete Event Simulation, but only Process Network simulations with "entities flowing through the system" we need to impose PN view on the Online Sneaker Shop business process. This requires to figure out what could be used as "entities" for being able to make a PN model.