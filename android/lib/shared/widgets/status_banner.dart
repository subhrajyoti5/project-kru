import 'package:flutter/material.dart';

class StatusBanner extends StatelessWidget {
  const StatusBanner({super.key, required this.message, this.error = false, this.success = false});

  final String message;
  final bool error;
  final bool success;

  @override
  Widget build(BuildContext context) {
    // Determine colors based on status
    final backgroundColor = error 
        ? const Color(0xFF3a2a2a)
        : success 
        ? const Color(0xFF2a3a2a)
        : const Color(0xFF2a2a3a);
    
    final borderColor = error 
        ? const Color(0xFFff3b30).withOpacity(0.3)
        : success 
        ? const Color(0xFF34c759).withOpacity(0.3)
        : const Color(0xFF0066cc).withOpacity(0.3);
    
    final iconColor = error 
        ? const Color(0xFFff3b30)
        : success 
        ? const Color(0xFF34c759)
        : const Color(0xFF0066cc);
    
    final textColor = error 
        ? const Color(0xFFff453a)
        : success 
        ? const Color(0xFF34c759)
        : const Color(0xFF2997ff);
    
    final icon = error 
        ? Icons.error_outline
        : success 
        ? Icons.check_circle_outline
        : Icons.info_outlined;
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: borderColor,
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(
              icon,
              size: 16,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13.5,
                height: 1.5,
                letterSpacing: -0.2,
                fontWeight: FontWeight.w400,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
